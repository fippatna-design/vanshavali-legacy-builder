# Vanshavali (Digital Family Tree) PWA — Build Plan

Your spec is huge — realistically a multi-week product, not a single build. I'll ship it in verified phases so each layer works end-to-end before we stack the next. Please confirm the phase order (or reshuffle) and I'll start on Phase 1 immediately.

## Guiding decisions (please confirm or change)

- **Backend:** Lovable Cloud (Postgres + Auth + Storage + server functions). Enables real auth, RLS, file uploads, secure payment verification.
- **Stack:** TanStack Start (already scaffolded) + Tailwind v4 + shadcn. Tree visualization via `react-flow` (pan/zoom/mobile gestures).
- **PDF/print:** server-side generation via `@react-pdf/renderer` in a server function, gated by a server-verified `payment_entitlements` row.
- **Payments:** Razorpay (India-first). I'll build the full order → verify-signature → entitlement flow; you'll paste `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` when ready. Preview exports carry a watermark until entitlement exists.
- **Design:** deep maroon / antique gold / ivory / parchment heritage palette, Devanagari-capable typography (Tiro Devanagari Hindi + Inter), semantic tokens in `src/styles.css`.
- **i18n:** copy structured for Hindi + English from day one (single language toggle later).
- **PWA:** manifest + icons + guarded service worker with `NetworkFirst` HTML, per Lovable PWA rules.

## Phased delivery

**Phase 1 — Foundation (this turn if you approve)**
- Enable Lovable Cloud.
- Design system (maroon/gold/ivory tokens, fonts, heritage patterns).
- Landing page (Hindi + English hero, features, how it works, pricing placeholder, FAQ, CTA).
- Auth (email/password + Google), `_authenticated` gate, profiles table, `user_roles` table + `has_role` (super_admin, family_admin, contributor, viewer).
- Empty user dashboard shell.
- PWA manifest + icons.

**Phase 2 — Family data model & CRUD**
Tables + RLS + grants: `family_trees`, `family_origin` (gotra/kul/vansh/village/etc.), `family_members`, `marriages`, `parent_child_relationships`, `family_roles`, `family_invitations`, master tables (`caste_communities`, `gotras`, `geographic_locations`), `media_files`, `edit_history`, `audit_logs`.
- Create Vanshavali wizard (origin profile → founding ancestor).
- Add son / daughter / spouse flows with all fields from spec §3–§5.
- Data-integrity guards (no self-parent, no cycles, duplicate warnings).
- Photo upload to Storage.

**Phase 3 — Visual tree**
- react-flow tree with color-coded nodes (sons blue, daughters rose, DIL purple, SIL teal, maternal branch gold, deceased grayscale, root gold).
- Zoom/pan/fullscreen, expand/collapse, search, generation filter, paternal/maternal filter.
- Member detail drawer.
- Generation auto-numbering (English + Hindi labels).

**Phase 4 — Collaboration & privacy**
- Invite by email/link, roles, contribution approval queue, edit history, restore.
- Tree visibility: private / link-only / public.
- Field-level privacy (DOB, address, contact).
- Public search restricted to public trees only.

**Phase 5 — Payments & paid export**
- `payments`, `payment_entitlements`, `coupons`, `export_orders` tables.
- Razorpay order/verify server functions (signature check server-side).
- Watermarked preview PDF (free) vs full PDF/high-res/poster (entitled).
- Multiple print templates (traditional, modern, royal, manuscript, horizontal, vertical, poster).
- QR code back to digital tree.

**Phase 6 — Super Admin panel**
Full CRUD for every module in spec §15: users, families, members, masters (caste/gotra/kul/vansh/geo), themes, templates, pricing, coupons, payments, exports, public trees, reports, roles, notifications, CMS, FAQs, inquiries, SEO, settings, audit logs. Role-gated server-side.

**Phase 7 — Polish**
- Offline shell (guarded SW per PWA skill).
- SEO/OG/JSON-LD on public tree pages.
- Sitemap + robots.
- Perf pass, mobile QA, accessibility pass.
- Completion report (done / partial / needs-credentials).

## What I need from you now

1. **Approve the phase order** (or tell me which phase is highest priority — e.g. "skip admin panel for v1", "payments first").
2. **Confirm Razorpay** as the gateway (or name another — Stripe, Paddle, Cashfree, PhonePe).
3. **Confirm Lovable Cloud** is fine as the backend (recommended).
4. **Language default:** Hindi-first with English toggle, or English-first?

Once you reply I'll start Phase 1 in the next turn. If you'd rather I just start building Phase 1 with the defaults above, say "go with defaults" and I'll proceed.
