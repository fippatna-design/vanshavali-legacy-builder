import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Vanshavali" },
      { name: "description", content: "Answers to common questions about building your digital family tree." },
      { property: "og:title", content: "FAQ — Vanshavali" },
      { property: "og:description", content: "Answers about privacy, pricing, and printing your Vanshavali." },
    ],
  }),
  component: Faq,
});

const items = [
  {
    q: "Is Vanshavali free to use?",
    a: "Yes. Creating your account, building the family tree, adding people, and previewing the tree are all free. You only pay when you want to download or print a heritage-quality PDF.",
  },
  {
    q: "Are daughters part of the family tree?",
    a: "Absolutely. Daughters are first-class members of the tree and remain visible after marriage. You can record their spouse's surname, gotra, and native village, and add their children (nati/natin) as a distinct maternal branch.",
  },
  {
    q: "Is my family data private?",
    a: "Yes. All family trees are private by default. You can choose to share via a private link or make a tree publicly discoverable. Sensitive fields for living members are private unless you explicitly enable them.",
  },
  {
    q: "How many generations can I record?",
    a: "There is no fixed limit on generations. Add as many as your family history holds.",
  },
  {
    q: "Which payment methods will you support?",
    a: "We're building support for Indian payment methods including UPI, cards, and net banking. Payments will roll out with the print engine in the next update.",
  },
  {
    q: "Can multiple family members contribute to one tree?",
    a: "Yes. You'll be able to invite relatives with roles like Family Admin, Contributor, or Viewer, and approve contributions before they're added.",
  },
];

function Faq() {
  return (
    <div className="min-h-screen bg-parchment-gradient">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <h1 className="font-heading text-4xl font-semibold text-primary md:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground">Everything you might want to know.</p>
        <Accordion type="single" collapsible className="mt-8">
          {items.map((it, i) => (
            <AccordionItem key={i} value={"i" + i} className="border-border">
              <AccordionTrigger className="text-left font-heading text-base font-medium text-foreground">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <SiteFooter />
    </div>
  );
}
