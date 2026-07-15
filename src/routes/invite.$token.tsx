import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Vanshavali — Accept invitation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

type Status = "loading" | "need-auth" | "invalid" | "accepting" | "done" | "error";

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");
  const [treeId, setTreeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();

      if (!userRes.user) {
        // Only peek — do not accept yet
        const { data, error } = await supabase.rpc("peek_invitation", { _token: token });
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
          setStatus("invalid");
          setMessage("This invitation link is invalid, expired, or already used.");
          return;
        }
        setTreeId(row.tree_id);
        setStatus("need-auth");
        return;
      }

      setStatus("accepting");
      const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        setStatus("error");
        setMessage(error?.message ?? "Invitation invalid, expired, or already used.");
        return;
      }
      setTreeId(row.tree_id);
      setStatus("done");
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment-gradient px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-heritage">
        {status === "loading" || status === "accepting" ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              {status === "accepting" ? "Joining Vanshavali…" : "Checking invitation…"}
            </p>
          </>
        ) : status === "need-auth" ? (
          <>
            <h1 className="font-heading text-2xl text-primary">Sign in to accept</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You need an account to join this Vanshavali. Sign in and return to this link.
            </p>
            <Button
              className="mt-5"
              onClick={() =>
                navigate({ to: "/auth", search: { redirect: `/invite/${token}` } as never })
              }
            >
              Sign in / Register
            </Button>
          </>
        ) : status === "done" ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-3 font-heading text-2xl text-primary">You're in!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You now have access to this Vanshavali.
            </p>
            <Button className="mt-5" asChild>
              {treeId ? (
                <Link to="/tree/$treeId" params={{ treeId }}>Open Vanshavali</Link>
              ) : (
                <Link to="/dashboard">Dashboard</Link>
              )}
            </Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 font-heading text-2xl text-primary">Invitation problem</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-5" variant="outline" asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
