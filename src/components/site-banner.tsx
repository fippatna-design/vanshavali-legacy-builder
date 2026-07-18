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

export function SiteBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["site-banners"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_banners")
        .select("id,message,link_url,link_label,bg_color,text_color")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(3);
      if (error) return [] as Banner[];
      return (data ?? []) as Banner[];
    },
    staleTime: 60_000,
  });

  const banners = (data ?? []).filter((b) => !dismissed.has(b.id));
  if (banners.length === 0) return null;

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
