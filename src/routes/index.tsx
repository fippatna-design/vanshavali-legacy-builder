import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TreePine,
  Users,
  Heart,
  Shield,
  Printer,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

import heroTree from "@/assets/hero-tree.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment-gradient">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-heritage-pattern">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-devanagari">डिजिटल वंशावली प्लेटफ़ॉर्म</span>
            </div>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] text-primary md:text-6xl">
              अपनी वंशावली को
              <br />
              <span className="text-devanagari text-accent">पीढ़ियों तक</span> सुरक्षित रखें
            </h1>
            <p className="mt-5 max-w-lg text-base text-foreground/80 md:text-lg">
              Create a beautiful digital family tree. Record every son, daughter, marriage,
              gotra, kul, and ancestral village — then share privately or print a heritage-quality Vanshavali.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-heritage">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start your Vanshavali — free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/features">See features</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to build. Pay only when you print or export.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl" aria-hidden />
            <img
              src={heroTree}
              alt="Ornate Indian family tree illustration with golden banyan and heritage patterns"
              width={1600}
              height={1000}
              className="relative w-full rounded-2xl border-4 border-accent/70 shadow-gold"
            />
          </div>
        </div>
      </section>

      <div className="gold-divider mx-auto max-w-3xl" />

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold text-primary md:text-4xl">
            Everything a family archivist needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Purpose-built for Indian family traditions — respectful of every relationship, every branch, every generation.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: TreePine,
              title: "Unlimited generations",
              body: "Add the founding ancestor and grow the tree — sons, daughters, and beyond — with no artificial depth limit.",
            },
            {
              icon: Heart,
              title: "Daughters never disappear",
              body: "Record marriages, in-laws' family, and nati/natin as a distinct maternal branch. Every descendant honored.",
            },
            {
              icon: Users,
              title: "Gotra, kul & ancestral village",
              body: "Capture cultural identity: caste/community, gotra, kul, kuldevta, ancestral village, migration history.",
            },
            {
              icon: Shield,
              title: "Private by default",
              body: "Your family data is yours. Choose private, share-by-link, or public — with field-level privacy controls.",
            },
            {
              icon: Sparkles,
              title: "Beautiful interactive tree",
              body: "Color-coded, zoomable, mobile-friendly. Distinct colors for sons, daughters, in-laws, and maternal branches.",
            },
            {
              icon: Printer,
              title: "Heritage-quality print",
              body: "Export as A4, A3, A2 or wall-poster PDF in traditional, modern, or royal manuscript templates.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-heritage transition-all hover:-translate-y-0.5 hover:border-accent/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-accent/20 group-hover:text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-primary md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">Three steps to preserve your lineage.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Record your origin",
                body: "Enter surname, gotra, kul, ancestral village, and the founding ancestor of your Vanshavali.",
              },
              {
                n: "02",
                title: "Add generation by generation",
                body: "Add sons, daughters, spouses, and children. The tree grows automatically with correct relationships.",
              },
              {
                n: "03",
                title: "Share or print",
                body: "Preview and share privately. When ready, unlock heritage-quality PDF and poster export.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-heading text-4xl font-semibold text-accent">{s.n}</div>
                <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold text-primary md:text-4xl">
            Build for free. Pay when you print.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No credit card required to start. Unlock printing when your Vanshavali is ready.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Free forever
            </div>
            <div className="mt-2 font-heading text-4xl font-semibold text-foreground">₹0</div>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to build.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Create your family tree",
                "Unlimited generations",
                "Sons, daughters & marriages",
                "Photos & biographies",
                "Private sharing",
                "Watermarked preview PDF",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth" search={{ mode: "signup" }}>Start building</Link>
            </Button>
          </div>

          <div className="relative rounded-2xl border-2 border-accent bg-card p-8 shadow-gold">
            <div className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Premium Print
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pay per export
            </div>
            <div className="mt-2 font-heading text-4xl font-semibold text-foreground">
              from ₹499
            </div>
            <p className="mt-1 text-sm text-muted-foreground">One-time payment per Vanshavali.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "High-resolution PDF (no watermark)",
                "A4 / A3 / A2 / A1 poster export",
                "Traditional, royal & modern templates",
                "QR code back to your digital tree",
                "Print-ready color profile",
                "Lifetime download",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link to="/pricing">See print options</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-20">
          <h2 className="text-devanagari font-heading text-3xl font-semibold md:text-4xl">
            आज ही अपनी वंशावली बनाना शुरू करें
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Start today. Take your first generation online in minutes.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your free account
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
