import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ t: z.string().optional() });

export const Route = createFileRoute("/tree/$treeId/public")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: "Vanshavali — Family Tree" },
      { name: "description", content: "A public family tree on Vanshavali." },
      { property: "og:title", content: "Family tree on Vanshavali" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: `index, follow` },
      { name: "vanshavali:tree", content: params.treeId },
    ],
  }),
  component: PublicTreePage,
});

type Tree = {
  id: string;
  name: string;
  surname: string | null;
  gotra: string | null;
  kul: string | null;
  ancestral_village: string | null;
  description: string | null;
  visibility: "private" | "link" | "public";
};

type Member = {
  id: string;
  full_name: string;
  gender: string | null;
  is_alive: boolean;
  is_root: boolean;
  generation: number | null;
  birth_place: string | null;
  current_place: string | null;
  occupation: string | null;
  date_of_birth: string | null;
  hide_dob: boolean;
  hide_contact: boolean;
};

function PublicTreePage() {
  const { treeId } = Route.useParams();
  const { t: token } = Route.useSearch();

  const treeQuery = useQuery({
    queryKey: ["public_tree", treeId, token ?? null],
    queryFn: async (): Promise<Tree | null> => {
      const { data, error } = await supabase.rpc("get_shared_tree", {
        _tree_id: treeId,
        _token: token ?? undefined,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as Tree | undefined) ?? null;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["public_members", treeId, token ?? null],
    enabled: !!treeQuery.data,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.rpc("get_shared_tree_members", {
        _tree_id: treeId,
        _token: token ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  if (treeQuery.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }

  const tree = treeQuery.data;
  if (!tree) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment-gradient px-4 text-center">
        <div>
          <h1 className="font-heading text-2xl text-primary">Vanshavali not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This tree is private, or the share link is missing or invalid.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const members = membersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-parchment-gradient">
      <header className="border-b border-border/60 bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="font-heading text-lg font-semibold text-primary">
            Vanshavali
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Create your own</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="text-center">
          <p className="font-devanagari text-xs uppercase tracking-[0.3em] text-accent">वंशावली</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-primary md:text-5xl">
            {tree.name}
          </h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {[
              tree.surname && `Surname: ${tree.surname}`,
              tree.gotra && `Gotra: ${tree.gotra}`,
              tree.kul && `Kul: ${tree.kul}`,
              tree.ancestral_village && `Village: ${tree.ancestral_village}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {tree.description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">{tree.description}</p>
          )}
        </div>

        <h2 className="mt-10 font-heading text-xl font-semibold text-primary">
          Members <span className="text-muted-foreground">({members.length})</span>
        </h2>

        {members.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No members recorded yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
                {(m.birth_place || m.current_place || m.occupation || m.date_of_birth) && (
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {m.date_of_birth && <div>Born: {m.date_of_birth}</div>}
                    {m.birth_place && <div>Birth place: {m.birth_place}</div>}
                    {m.current_place && <div>Lives: {m.current_place}</div>}
                    {m.occupation && <div>Work: {m.occupation}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Preserved on Vanshavali · वंशावली
        </p>
      </main>
    </div>
  );
}
