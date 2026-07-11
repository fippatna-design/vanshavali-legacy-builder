import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Vanshavali" },
      { name: "description", content: "Free to build. Pay only when you print or export your family tree." },
      { property: "og:title", content: "Pricing — Vanshavali" },
      { property: "og:description", content: "Free to build. Pay per export for heritage-quality print." },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Free",
    price: "₹0",
    tag: "Forever",
    features: ["Create your family tree", "Unlimited generations", "Sons, daughters, marriages", "Photos & biographies", "Private sharing", "Watermarked preview PDF"],
    cta: "Start free",
  },
  {
    name: "A4 Print",
    price: "₹499",
    tag: "One-time",
    features: ["High-resolution A4 PDF", "No watermark", "3 template designs", "QR code", "Lifetime download"],
    cta: "Coming soon",
    highlight: true,
  },
  {
    name: "Poster",
    price: "₹1,499",
    tag: "One-time",
    features: ["A2 & A1 wall poster PDF", "All A4 features", "Royal manuscript template", "Print-ready color profile", "Custom family emblem"],
    cta: "Coming soon",
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-parchment-gradient">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold text-primary md:text-5xl">Pricing</h1>
          <p className="mt-3 text-muted-foreground">
            Build for free. Pay only when you're ready to print a beautiful Vanshavali.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                "rounded-2xl border bg-card p-8 " +
                (t.highlight ? "border-2 border-accent shadow-gold" : "border-border shadow-heritage")
              }
            >
              <div className="flex items-baseline justify-between">
                <div className="font-heading text-xl font-semibold text-primary">{t.name}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.tag}</div>
              </div>
              <div className="mt-3 font-heading text-4xl font-semibold text-foreground">{t.price}</div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={t.highlight ? "default" : "outline"}>
                <Link to="/auth" search={{ mode: "signup" }}>{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Final print pricing may vary by template and format. Prices in INR.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
