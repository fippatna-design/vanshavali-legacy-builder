import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Plus, TreePine, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vanshavali" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          <Button size="lg" disabled className="shadow-heritage">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Vanshavali
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
            <TreePine className="h-7 w-7 text-accent" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
            No family trees yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The Vanshavali builder is being prepared in the next phase. Your account is ready —
            we're wiring up the family-tree data model, the interactive tree, and the print engine next.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Family origin", body: "Surname, gotra, kul, ancestral village — coming next." },
            { title: "Interactive tree", body: "Color-coded, zoomable, mobile-friendly." },
            { title: "Print & export", body: "Heritage-quality PDF, unlocked with payment." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-5 opacity-80">
              <div className="font-heading text-sm font-semibold text-primary">{c.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
