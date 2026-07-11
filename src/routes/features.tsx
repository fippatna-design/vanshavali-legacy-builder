import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Vanshavali" },
      { name: "description", content: "Everything Vanshavali offers to build and preserve your family tree." },
      { property: "og:title", content: "Features — Vanshavali" },
      { property: "og:description", content: "Sons, daughters, marriages, maternal branches, gotra, printing." },
    ],
  }),
  component: Features,
});

const groups = [
  {
    title: "Family origin",
    items: ["Surname, caste, sub-caste", "Gotra, Kul, Vansh, Pravara", "Kuldevi & Kuldevta", "Ancestral village, tehsil, district, state", "Migration history", "Family emblem & cover image"],
  },
  {
    title: "People & relationships",
    items: ["Sons, daughters, spouses", "Multiple marriages, remarriage, adoption", "Daughters remain in tree after marriage", "Nati / natin as maternal branch", "In-laws' surname, gotra, native village", "Photos, biography, achievements"],
  },
  {
    title: "Visual tree",
    items: ["Color-coded by relationship", "Zoom, pan, fullscreen", "Search by name", "Filter by generation or branch", "Expand/collapse branches", "Mobile touch gestures"],
  },
  {
    title: "Privacy & collaboration",
    items: ["Private / link-only / public", "Invite family members", "Role-based access", "Contribution approvals", "Edit history", "Field-level privacy controls"],
  },
  {
    title: "Print & export",
    items: ["Traditional Vanshavali template", "Royal manuscript template", "Modern minimal template", "A4 / A3 / A2 / A1 poster export", "QR code back to digital tree", "No watermark after payment"],
  },
];

function Features() {
  return (
    <div className="min-h-screen bg-parchment-gradient">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <h1 className="font-heading text-4xl font-semibold text-primary md:text-5xl">Features</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A complete platform for building, preserving, and printing your Vanshavali — respectful of Indian family traditions.
        </p>
        <div className="mt-12 space-y-8">
          {groups.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border bg-card p-6 shadow-heritage md:p-8">
              <h2 className="font-heading text-2xl font-semibold text-primary">{g.title}</h2>
              <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                {g.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground/85">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
