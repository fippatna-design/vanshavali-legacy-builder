import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  bg_color: string;
  text_color: string;
};

export function SiteBanner({ placement = "top" }: { placement?: "top" | "home_card" }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["site-banners", placement],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_banners")
        .select("id,message,link_url,link_label,bg_color,text_color")
        .eq("is_active", true)
        .eq("placement", placement)
        .order("sort_order", { ascending: true })
        .limit(3);
      if (error) return [] as Banner[];
      return (data ?? []) as Banner[];
    },
    staleTime: 60_000,
  });

  const banners = (data ?? []).filter((b) => !dismissed.has(b.id));
  if (banners.length === 0) return null;

  if (placement === "home_card") {
    return (
      <div className="mx-auto grid max-w-6xl gap-3 px-4 pt-6 md:px-6">
        {banners.map((b) => (
          <div
            key={b.id}
            style={{ backgroundColor: b.bg_color, color: b.text_color }}
            className="relative overflow-hidden rounded-2xl px-5 py-4 shadow-heritage sm:px-6 sm:py-5"
          >
            <div className="flex flex-col items-start gap-2 pr-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-sm font-medium leading-snug sm:text-base">{b.message}</p>
              {b.link_url && (
                <a
                  href={b.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-current/30 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/20 sm:text-sm"
                  style={{ color: b.text_color }}
                >
                  {b.link_label || "Learn more"} →
                </a>
              )}
            </div>
            <button
              aria-label="Dismiss"
              onClick={() =>
                setDismissed((s) => {
                  const n = new Set(s);
                  n.add(b.id);
                  return n;
                })
              }
              className="absolute right-2 top-2 rounded p-1 opacity-70 hover:opacity-100"
              style={{ color: b.text_color }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="w-full">
      {banners.map((b) => (
        <div
          key={b.id}
          style={{ backgroundColor: b.bg_color, color: b.text_color }}
          className="relative px-4 py-2 text-center text-sm"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 pr-6">
            <span className="line-clamp-2">{b.message}</span>
            {b.link_url && (
              <a
                href={b.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 shrink-0 underline underline-offset-2"
                style={{ color: b.text_color }}
              >
                {b.link_label || "Learn more"}
              </a>
            )}
          </div>
          <button
            aria-label="Dismiss"
            onClick={() =>
              setDismissed((s) => {
                const n = new Set(s);
                n.add(b.id);
                return n;
              })
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 hover:opacity-100"
            style={{ color: b.text_color }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
