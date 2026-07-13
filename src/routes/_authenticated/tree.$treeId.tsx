import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, GitBranch, Heart, Link2, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/tree/$treeId")({
  head: () => ({
    meta: [
      { title: "Vanshavali — Members" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TreePage,
});

type Tree = {
  id: string;
  name: string;
  surname: string | null;
  gotra: string | null;
  kul: string | null;
  ancestral_village: string | null;
  description: string | null;
};

type Member = {
  id: string;
  full_name: string;
  gender: "male" | "female" | "other" | null;
  is_alive: boolean;
  is_root: boolean;
  generation: number | null;
  birth_place: string | null;
  current_place: string | null;
  occupation: string | null;
  notes: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
};

function TreePage() {
  const { treeId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const treeQuery = useQuery({
    queryKey: ["family_tree", treeId],
    queryFn: async (): Promise<Tree> => {
      const { data, error } = await supabase
        .from("family_trees")
        .select("id, name, surname, gotra, kul, ancestral_village, description")
        .eq("id", treeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["family_members", treeId],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("family_members")
        .select(
          "id, full_name, gender, is_alive, is_root, generation, birth_place, current_place, occupation, notes, date_of_birth, date_of_death",
        )
        .eq("tree_id", treeId)
        .order("generation", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const pcQuery = useQuery({
    queryKey: ["pc", treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_child_relationships")
        .select("id, parent_id, child_id, relationship_type")
        .eq("tree_id", treeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const marriagesQuery = useQuery({
    queryKey: ["marriages", treeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marriages")
        .select("id, spouse_a_id, spouse_b_id, status")
        .eq("tree_id", treeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["family_members", treeId] });
      queryClient.invalidateQueries({ queryKey: ["pc", treeId] });
      queryClient.invalidateQueries({ queryKey: ["marriages", treeId] });
    },
    onError: (e: Error) => toast.error("Could not remove", { description: e.message }),
  });

  const deleteTree = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("family_trees").delete().eq("id", treeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vanshavali deleted");
      queryClient.invalidateQueries({ queryKey: ["family_trees"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error("Could not delete", { description: e.message }),
  });

  if (treeQuery.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }
  if (treeQuery.error || !treeQuery.data) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Vanshavali not found.</p>
        <Link to="/dashboard" className="mt-3 inline-block text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const tree = treeQuery.data;
  const members = membersQuery.data ?? [];
  const pcs = pcQuery.data ?? [];
  const marriages = marriagesQuery.data ?? [];
  const relByMember = useMemo(() => {
    const parents = new Map<string, string[]>();
    const children = new Map<string, string[]>();
    const spouses = new Map<string, string[]>();
    for (const p of pcs) {
      children.set(p.parent_id, [...(children.get(p.parent_id) ?? []), p.child_id]);
      parents.set(p.child_id, [...(parents.get(p.child_id) ?? []), p.parent_id]);
    }
    for (const m of marriages) {
      spouses.set(m.spouse_a_id, [...(spouses.get(m.spouse_a_id) ?? []), m.spouse_b_id]);
      spouses.set(m.spouse_b_id, [...(spouses.get(m.spouse_b_id) ?? []), m.spouse_a_id]);
    }
    return { parents, children, spouses };
  }, [pcs, marriages]);
  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.full_name])), [members]);

  return (
    <div className="min-h-screen bg-parchment-gradient">
      <header className="border-b border-border/60 bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/tree/$treeId/view" params={{ treeId }}>
                <GitBranch className="h-4 w-4 md:mr-1.5" />
                <span className="hidden md:inline">View Tree</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Delete this Vanshavali and all its members? This cannot be undone.")) {
                  deleteTree.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Delete Vanshavali</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary md:text-4xl">{tree.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {[tree.surname && `Surname: ${tree.surname}`, tree.gotra && `Gotra: ${tree.gotra}`, tree.kul && `Kul: ${tree.kul}`, tree.ancestral_village && `Village: ${tree.ancestral_village}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {tree.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{tree.description}</p>}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-primary">
            Members <span className="text-muted-foreground">({members.length})</span>
          </h2>
          <AddMemberDialog treeId={treeId} open={addOpen} onOpenChange={setAddOpen} />
        </div>

        {membersQuery.isLoading ? (
          <div className="mt-6 text-muted-foreground">Loading members…</div>
        ) : members.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15">
              <User className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mt-3 font-heading text-lg font-semibold">No members yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Add the eldest known ancestor first (mark them as root), then their children generation by generation.
            </p>
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add first member
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-heading text-base font-semibold text-primary">
                      {m.full_name}
                      {m.is_root && (
                        <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-foreground">
                          Root
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {m.gender ?? "—"}
                      {typeof m.generation === "number" && ` · Gen ${m.generation}`}
                      {!m.is_alive && " · Deceased"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${m.full_name}?`)) deleteMember.mutate(m.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {(m.birth_place || m.current_place || m.occupation) && (
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {m.birth_place && <div>Born: {m.birth_place}</div>}
                    {m.current_place && <div>Lives: {m.current_place}</div>}
                    {m.occupation && <div>Work: {m.occupation}</div>}
                  </div>
                )}
                {m.notes && <p className="mt-2 text-sm text-muted-foreground">{m.notes}</p>}
                <MemberRelations
                  member={m}
                  members={members}
                  parentIds={relByMember.parents.get(m.id) ?? []}
                  childIds={relByMember.children.get(m.id) ?? []}
                  spouseIds={relByMember.spouses.get(m.id) ?? []}
                  nameById={nameById}
                  treeId={treeId}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function AddMemberDialog({
  treeId,
  open,
  onOpenChange,
}: {
  treeId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    gender: "male" as "male" | "female" | "other",
    is_alive: true,
    is_root: false,
    generation: "",
    birth_place: "",
    current_place: "",
    occupation: "",
    date_of_birth: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("family_members").insert({
        tree_id: treeId,
        full_name: form.full_name.trim(),
        gender: form.gender,
        is_alive: form.is_alive,
        is_root: form.is_root,
        generation: form.generation ? Number(form.generation) : null,
        birth_place: form.birth_place.trim() || null,
        current_place: form.current_place.trim() || null,
        occupation: form.occupation.trim() || null,
        date_of_birth: form.date_of_birth || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added");
      queryClient.invalidateQueries({ queryKey: ["family_members", treeId] });
      setForm({
        full_name: "",
        gender: "male",
        is_alive: true,
        is_root: false,
        generation: "",
        birth_place: "",
        current_place: "",
        occupation: "",
        date_of_birth: "",
        notes: "",
      });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Add family member</DialogTitle>
          <DialogDescription>Add a person to this Vanshavali.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.full_name.trim()) return;
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name *</Label>
            <Input
              id="full_name"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generation">Generation #</Label>
              <Input
                id="generation"
                type="number"
                min={0}
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_place">Birth place</Label>
              <Input
                id="birth_place"
                value={form.birth_place}
                onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_place">Current place</Label>
              <Input
                id="current_place"
                value={form.current_place}
                onChange={(e) => setForm({ ...form, current_place: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2">
              <Switch
                id="is_root"
                checked={form.is_root}
                onCheckedChange={(v) => setForm({ ...form, is_root: v })}
              />
              <Label htmlFor="is_root" className="cursor-pointer">Mark as root ancestor</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_alive"
                checked={form.is_alive}
                onCheckedChange={(v) => setForm({ ...form, is_alive: v })}
              />
              <Label htmlFor="is_alive" className="cursor-pointer">Alive</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || !form.full_name.trim()}>
              {mutation.isPending ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberRelations({
  member,
  members,
  parentIds,
  childIds,
  spouseIds,
  nameById,
  treeId,
}: {
  member: { id: string; full_name: string };
  members: { id: string; full_name: string }[];
  parentIds: string[];
  childIds: string[];
  spouseIds: string[];
  nameById: Map<string, string>;
  treeId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newParent, setNewParent] = useState("");
  const [newSpouse, setNewSpouse] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pc", treeId] });
    queryClient.invalidateQueries({ queryKey: ["marriages", treeId] });
  };

  const addParent = useMutation({
    mutationFn: async (parentId: string) => {
      const { error } = await supabase.from("parent_child_relationships").insert({
        tree_id: treeId,
        parent_id: parentId,
        child_id: member.id,
        relationship_type: "biological",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Parent linked"); invalidate(); setNewParent(""); },
    onError: (e: Error) => toast.error("Could not link", { description: e.message }),
  });

  const addSpouse = useMutation({
    mutationFn: async (spouseId: string) => {
      const { error } = await supabase.from("marriages").insert({
        tree_id: treeId,
        spouse_a_id: member.id,
        spouse_b_id: spouseId,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Spouse linked"); invalidate(); setNewSpouse(""); },
    onError: (e: Error) => toast.error("Could not link", { description: e.message }),
  });

  const removeParent = useMutation({
    mutationFn: async (parentId: string) => {
      const { error } = await supabase
        .from("parent_child_relationships")
        .delete()
        .eq("tree_id", treeId)
        .eq("parent_id", parentId)
        .eq("child_id", member.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); invalidate(); },
  });

  const removeSpouse = useMutation({
    mutationFn: async (spouseId: string) => {
      const { error } = await supabase
        .from("marriages")
        .delete()
        .eq("tree_id", treeId)
        .or(`and(spouse_a_id.eq.${member.id},spouse_b_id.eq.${spouseId}),and(spouse_a_id.eq.${spouseId},spouse_b_id.eq.${member.id})`);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); invalidate(); },
  });

  const parentOptions = members.filter(
    (x) => x.id !== member.id && !parentIds.includes(x.id) && !childIds.includes(x.id),
  );
  const spouseOptions = members.filter(
    (x) => x.id !== member.id && !spouseIds.includes(x.id) && !parentIds.includes(x.id) && !childIds.includes(x.id),
  );

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
        <span className="text-muted-foreground">
          {parentIds.length} parent · {childIds.length} child · {spouseIds.length} spouse
        </span>
        <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => setOpen(true)}>
          <Link2 className="mr-1 h-3 w-3" /> Relations
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-primary">{member.full_name} — Relations</DialogTitle>
            <DialogDescription>Link parents, children (via the child's card), and spouses.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <section>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parents</div>
              {parentIds.length === 0 ? (
                <div className="text-sm text-muted-foreground">None</div>
              ) : (
                <ul className="space-y-1">
                  {parentIds.map((id) => (
                    <li key={id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-sm">
                      <span>{nameById.get(id) ?? id}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeParent.mutate(id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex gap-2">
                <Select value={newParent} onValueChange={setNewParent}>
                  <SelectTrigger><SelectValue placeholder="Add parent…" /></SelectTrigger>
                  <SelectContent>
                    {parentOptions.length === 0 && <div className="p-2 text-xs text-muted-foreground">No candidates</div>}
                    {parentOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!newParent || addParent.isPending} onClick={() => addParent.mutate(newParent)}>
                  Link
                </Button>
              </div>
            </section>

            <section>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Children</div>
              {childIds.length === 0 ? (
                <div className="text-sm text-muted-foreground">None. Open a child's card to set this person as their parent.</div>
              ) : (
                <ul className="space-y-1">
                  {childIds.map((id) => (
                    <li key={id} className="rounded-md bg-muted/40 px-2 py-1 text-sm">{nameById.get(id) ?? id}</li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Heart className="h-3 w-3" /> Spouses
              </div>
              {spouseIds.length === 0 ? (
                <div className="text-sm text-muted-foreground">None</div>
              ) : (
                <ul className="space-y-1">
                  {spouseIds.map((id) => (
                    <li key={id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-sm">
                      <span>{nameById.get(id) ?? id}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSpouse.mutate(id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex gap-2">
                <Select value={newSpouse} onValueChange={setNewSpouse}>
                  <SelectTrigger><SelectValue placeholder="Add spouse…" /></SelectTrigger>
                  <SelectContent>
                    {spouseOptions.length === 0 && <div className="p-2 text-xs text-muted-foreground">No candidates</div>}
                    {spouseOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!newSpouse || addSpouse.isPending} onClick={() => addSpouse.mutate(newSpouse)}>
                  Link
                </Button>
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
