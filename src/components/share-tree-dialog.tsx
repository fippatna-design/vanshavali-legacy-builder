import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Visibility = "private" | "link" | "public";
type Role = "viewer" | "editor";

export function ShareTreeDialog({
  treeId,
  visibility,
  isOwner,
}: {
  treeId: string;
  visibility: Visibility;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  const collabs = useQuery({
    queryKey: ["collabs", treeId],
    enabled: open && isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tree_collaborators")
        .select("id, user_id, role, created_at")
        .eq("tree_id", treeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const invites = useQuery({
    queryKey: ["invites", treeId],
    enabled: open && isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tree_invitations")
        .select("id, email, role, token, expires_at, accepted_at")
        .eq("tree_id", treeId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setVisibility = useMutation({
    mutationFn: async (v: Visibility) => {
      const { error } = await supabase
        .from("family_trees")
        .update({ visibility: v })
        .eq("id", treeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visibility updated");
      queryClient.invalidateQueries({ queryKey: ["family_tree", treeId] });
      queryClient.invalidateQueries({ queryKey: ["family_trees"] });
    },
    onError: (e: Error) => toast.error("Could not update", { description: e.message }),
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in");
      const { error } = await supabase.from("tree_invitations").insert({
        tree_id: treeId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: userRes.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation created — share the link with them");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["invites", treeId] });
    },
    onError: (e: Error) => toast.error("Could not invite", { description: e.message }),
  });

  const removeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tree_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invites", treeId] }),
  });

  const removeCollab = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tree_collaborators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Collaborator removed");
      queryClient.invalidateQueries({ queryKey: ["collabs", treeId] });
    },
  });

  const changeCollabRole = useMutation({
    mutationFn: async ({ id, r }: { id: string; r: Role }) => {
      const { error } = await supabase.from("tree_collaborators").update({ role: r }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collabs", treeId] }),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/tree/${treeId}/public`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Share Vanshavali</DialogTitle>
          <DialogDescription>
            Control who can see and edit this family tree.
          </DialogDescription>
        </DialogHeader>

        {!isOwner ? (
          <p className="text-sm text-muted-foreground">
            Only the tree owner can change sharing settings.
          </p>
        ) : (
          <div className="space-y-5">
            <section>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visibility
              </Label>
              <Select value={visibility} onValueChange={(v) => setVisibility.mutate(v as Visibility)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private — only you and collaborators</SelectItem>
                  <SelectItem value="link">Anyone with the link can view</SelectItem>
                  <SelectItem value="public">Public — discoverable and shareable</SelectItem>
                </SelectContent>
              </Select>
              {visibility !== "private" && (
                <div className="mt-2 flex items-center gap-2">
                  <Input readOnly value={publicUrl} className="text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copy(publicUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </section>

            <section>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invite by email
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!email.trim() || invite.isPending}
                  onClick={() => invite.mutate()}
                >
                  Invite
                </Button>
              </div>

              {(invites.data ?? []).length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {(invites.data ?? []).map((i) => {
                    const link = `${origin}/invite/${i.token}`;
                    return (
                      <li key={i.id} className="rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{i.email}</span>
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase text-accent-foreground">
                            {i.role}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(link)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeInvite.mutate(i.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 truncate text-[10px] text-muted-foreground">{link}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collaborators ({(collabs.data ?? []).length})
              </Label>
              {(collabs.data ?? []).length === 0 ? (
                <div className="mt-1.5 text-sm text-muted-foreground">No collaborators yet.</div>
              ) : (
                <ul className="mt-1.5 space-y-1.5">
                  {(collabs.data ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2.5 py-2 text-xs"
                    >
                      <span className="font-mono">{c.user_id.slice(0, 8)}…</span>
                      <div className="flex items-center gap-2">
                        <Select
                          value={c.role}
                          onValueChange={(v) => changeCollabRole.mutate({ id: c.id, r: v as Role })}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCollab.mutate(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
