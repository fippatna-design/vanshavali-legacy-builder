import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta auth.oauth namespace — local typed wrapper so TS is happy.
type AuthorizationDetails = {
  client?: { name?: string };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
type OAuthResult<T> = { data: T | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
  approveAuthorization: (
    id: string,
  ) => Promise<OAuthResult<{ redirect_url?: string; redirect_to?: string }>>;
  denyAuthorization: (
    id: string,
  ) => Promise<OAuthResult<{ redirect_url?: string; redirect_to?: string }>>;
};
const supabaseOAuth = (
  supabase.auth as unknown as { oauth: OAuthApi }
).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id:
      typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    )!;
    const { data, error } = await supabaseOAuth.getAuthorizationDetails(
      authorizationId,
    );
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-parchment-gradient px-4">
      <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-heritage">
        <h1 className="font-heading text-xl font-semibold text-primary">
          Could not load this authorization request
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAccount(data.user?.email ?? "");
    });
  }, []);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await supabaseOAuth.approveAuthorization(authorization_id)
      : await supabaseOAuth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment-gradient bg-heritage-pattern px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-heritage md:p-8">
        <p className="font-devanagari text-xs uppercase tracking-[0.3em] text-accent">
          वंशावली · Authorization
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold text-primary">
          Connect {clientName} to Vanshavali
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lets <strong>{clientName}</strong> use Vanshavali as you and act
          on your family trees.
        </p>

        {account && (
          <div className="mt-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            Signed in as <strong>{account}</strong>
          </div>
        )}

        <div className="mt-5 rounded-md border border-border bg-background/50 p-4 text-sm">
          <p className="font-medium text-foreground">This app will be able to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>List your family trees</li>
            <li>Read members inside your trees</li>
            <li>Add new members to trees you own or can edit</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            This does not bypass Vanshavali's permissions — the app acts within
            your access.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
          >
            Cancel connection
          </Button>
          <Button disabled={busy} onClick={() => decide(true)}>
            {busy ? "Please wait…" : `Approve ${clientName}`}
          </Button>
        </div>
      </div>
    </main>
  );
}
