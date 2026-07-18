import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, TreePine, LogOut, ArrowRight, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vanshavali" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type TreeRow = {
  id: string;
  name: string;
  surname: string | null;
  gotra: string | null;
  ancestral_village: string | null;
  description: string | null;
  updated_at: string;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const treesQuery = useQuery({
    queryKey: ["family_trees", user.id],
    queryFn: async (): Promise<TreeRow[]> => {
      const { data, error } = await supabase
        .from("family_trees")
        .select("id, name, surname, gotra, ancestral_village, description, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isSuperAdminQuery = useQuery({
    queryKey: ["is-super-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return !!data;
    },
  });


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <div className="min-h-screen bg-parchment-gradient">
      <header className="border-b border-border/60 bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md" />
            <div className="leading-tight">
              <div className="font-heading text-lg font-semibold text-primary">Vanshavali</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Dashboard</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isSuperAdminQuery.data && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/banners">Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </div>
        </div>

      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-devanagari text-sm text-accent">स्वागत है</p>
            <h1 className="mt-1 font-heading text-3xl font-semibold text-primary md:text-4xl">
              Welcome, {name}
            </h1>
            <p className="mt-1 text-muted-foreground">Your family trees will appear here.</p>
          </div>
          <CreateTreeDialog
            open={open}
            onOpenChange={setOpen}
            onCreated={(id) => {
              setOpen(false);
              queryClient.invalidateQueries({ queryKey: ["family_trees"] });
              navigate({ to: "/tree/$treeId", params: { treeId: id } });
            }}
          />
        </div>

        {treesQuery.isLoading ? (
          <div className="mt-10 text-center text-muted-foreground">Loading…</div>
        ) : (treesQuery.data?.length ?? 0) === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
              <TreePine className="h-7 w-7 text-accent" />
            </div>
            <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
              No family trees yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start your Vanshavali — add your surname, gotra and ancestral village, then build your family generation by generation.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create your first Vanshavali
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {treesQuery.data!.map((t) => (
              <Link
                key={t.id}
                to="/tree/$treeId"
                params={{ treeId: t.id }}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-accent hover:shadow-heritage"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-heading text-lg font-semibold text-primary">{t.name}</div>
                    <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {[t.surname, t.gotra].filter(Boolean).join(" · ") || "Family"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                {t.ancestral_village && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {t.ancestral_village}
                  </div>
                )}
                {t.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CreateTreeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { user } = Route.useRouteContext();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    gotra: "",
    kul: "",
    ancestral_village: "",
    language: "hi",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("family_trees")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          surname: form.surname.trim() || null,
          gotra: form.gotra.trim() || null,
          kul: form.kul.trim() || null,
          ancestral_village: form.ancestral_village.trim() || null,
          language: form.language,
          description: form.description.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Vanshavali created");
      onCreated(id);
    },
    onError: (e: Error) => toast.error("Could not create", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-heritage">
          <Plus className="mr-1.5 h-4 w-4" /> Create Vanshavali
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Create a new Vanshavali</DialogTitle>
          <DialogDescription>
            Start with your family identity — you can add members next.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Vanshavali name *</Label>
            <Input
              id="name"
              required
              placeholder="e.g. Sharma Family Vanshavali"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="surname">Surname</Label>
              <Input id="surname" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gotra">Gotra</Label>
              <Input id="gotra" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kul">Kul</Label>
              <Input id="kul" value={form.kul} onChange={(e) => setForm({ ...form, kul: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="village">Ancestral village</Label>
              <Input
                id="village"
                value={form.ancestral_village}
                onChange={(e) => setForm({ ...form, ancestral_village: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.name.trim()}>
              {mutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
