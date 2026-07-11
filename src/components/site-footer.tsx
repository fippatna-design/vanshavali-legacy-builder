import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="font-heading text-xl font-semibold text-primary">Vanshavali</div>
          <p className="mt-2 text-devanagari text-sm text-muted-foreground">
            पीढ़ियों की विरासत, डिजिटल रूप में।
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preserving Indian family lineage across generations.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Product
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/features" className="text-muted-foreground hover:text-primary">Features</Link></li>
            <li><Link to="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
            <li><Link to="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Account
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/auth" className="text-muted-foreground hover:text-primary">Sign in</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="text-muted-foreground hover:text-primary">Create account</Link></li>
            <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Legal
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="text-muted-foreground">Privacy (coming soon)</li>
            <li className="text-muted-foreground">Terms (coming soon)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vanshavali. All rights reserved.
      </div>
    </footer>
  );
}
