import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
      { title: "Home Banners — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBanners,
});

type Banner = {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  placement: "top" | "home_card";
};


function AdminBanners() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return nav({ to: "/auth" });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      setAllowed(!!data);
    })();
  }, [nav]);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    enabled: allowed === true,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const [form, setForm] = useState({
    message: "",
    link_url: "",
    link_label: "",
    bg_color: "#5a1a1a",
    text_color: "#f7f2e6",
    sort_order: 0,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("site_banners").insert({
        message: form.message.trim(),
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        bg_color: form.bg_color,
        text_color: form.text_color,
        sort_order: Number(form.sort_order) || 0,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner created");
      setForm({ message: "", link_url: "", link_label: "", bg_color: "#5a1a1a", text_color: "#f7f2e6", sort_order: 0 });
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["site-banners"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("site_banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["site-banners"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("site_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["site-banners"] });
    },
  });

  if (allowed === null) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!allowed)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-heading text-2xl text-primary">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only super admins can manage banners.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-parchment-gradient">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <h1 className="font-heading text-3xl font-semibold text-primary">Home Page Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ads / announcements shown at the top of every page. Only super admins see this.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-heritage">
          <h2 className="font-heading text-lg font-semibold">Add new banner</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <Label>Message *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="🎉 Announcing free Vanshavali prints this month!"
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Link URL (optional)</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label>Link label</Label>
                <Input
                  value={form.link_label}
                  onChange={(e) => setForm({ ...form, link_label: e.target.value })}
                  placeholder="Learn more"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Background</Label>
                <Input type="color" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} />
              </div>
              <div>
                <Label>Text color</Label>
                <Input type="color" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!form.message.trim() || createMut.isPending}
              className="mt-1 w-full sm:w-auto"
            >
              <Plus className="mr-1 h-4 w-4" /> Add banner
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {banners.length === 0 && (
            <p className="text-sm text-muted-foreground">No banners yet.</p>
          )}
          {banners.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div
                    className="mb-2 truncate rounded px-3 py-1 text-sm"
                    style={{ background: b.bg_color, color: b.text_color }}
                  >
                    {b.message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {b.link_url ? `${b.link_label || "Link"} → ${b.link_url}` : "No link"} · order {b.sort_order}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={b.is_active}
                      onCheckedChange={(v) => toggleMut.mutate({ id: b.id, is_active: v })}
                    />
                    <span className="text-xs text-muted-foreground">{b.is_active ? "Live" : "Off"}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
