# SeatPass Admin — UI design notes

Read this before changing the admin's look. The mobile app has its own notes
in `mobile/docs/UI_DESIGN_NOTES.md` (same brand, same contrast rules).

Last update: 2026-10-22. The pages were checked rendered at 1440×900 and
390×844 with sample data.

## Rules

- **Brand.** The brand is SeatPass teal (Tailwind `primary` = `#0F766E`;
  `primary-50…950` is the teal scale). White text on `primary` is 5.47:1.
  `primary-600` `#0D9488` is for fills and icons, not text. The logo is
  `public/seatpass-mark.png`.
- **Text colours.** Secondary text uses `slate-500` (4.76:1) or `slate-600`.
  `slate-400` is only for icons and placeholders on tinted fields. Status
  text uses the `*-800` shade on `*-50`.
- **Statuses.** Use `<StatusBadge status=… />`
  (`components/ui/status-badge.tsx`). It knows every API status value, shows
  a dot plus a readable label, and falls back to neutral for unknown values.
  Don't hand-roll status pills.
- **Tables.** List and detail tables are plain `<table className="data-table …">`.
  The `.data-table` rules in `index.css` give them a sticky header and a row
  hover. Show names, not IDs: look a route ID up through `useRoutes()` and
  show "Origin → Destination".
- **Navigation.** `components/layout/nav.ts` is the only nav list. The
  sidebar, the mobile drawer and the header breadcrumb all read from it, so
  add new pages there.
- **Empty and error states.** Use `EmptyState` and `ErrorState` from
  `components/ui` (tinted icon circle). Use `Skeleton` while loading; it has
  a shimmer and `data-slot="skeleton"`, which tests can target.
- **Motion.** Pages ease in on navigation (`AdminLayout`), KPI cards
  stagger, and the bars animate their width. Everything respects
  `prefers-reduced-motion`: a global CSS rule, plus `isAnimationActive`
  on the Recharts charts.
- **Previewing without the backend.** Add a throwaway entry file that stubs
  `supabase.auth.getSession` and `window.fetch` for `/api/*`, served by a
  Vite config whose `transformIndexHtml` swaps `/src/main.tsx` for it.
  Delete both afterwards.

## Audit (2026-10-22)

| Area | Before | After | Notes |
|---|---|---|---|
| Shell (sidebar, header, mobile menu) | 6 | 8 | Was off-brand blue "BusMobileApp", a flat 13-item list, a dead bell, and a mobile menu missing 4 pages. Now grouped nav, breadcrumb, user card, and a full mobile drawer |
| Login | 4 | 8 | Was a bare card that called `navigate()` during render. Now a split brand panel, field icons, a password toggle and an announced error |
| Dashboard | 6 | 8 | Fixed future months plotted as 0, the "Lifetime" label on a yearly total, raw ID fragments in Active Trips and raw axis numbers. Added teal charts, KPI tiles and proportion bars |
| List pages (all 14 tables) | 6 | 7–8 | Shared `data-table` style, `StatusBadge`, route names in Schedules, Bus detail and Driver detail; fixed a garbled "â€”" dash on Buses |
| Forms, dialogs, detail pages | 6 | 7 | Inherit the tokens, focus rings and badges; layouts unchanged |

## Partner Portal (2026-10-23)

Bus company staff (role `operator`) sign in on the same `/login` and land on
`/partner`; admins land on `/`. Each side redirects the wrong role away
(`ProtectedRoute role=…`, `homePathFor` in `src/lib/roles.ts`).

- **One shell, two consoles.** `AdminLayout` takes a `ConsoleConfig`
  (`src/components/layout/console.ts`): nav, badge ("Admin" / "Partner"),
  subtitle (company name) and whether the bell shows. Sidebar and header read
  it with `useConsole()`; don't fork them.
- **Pages** live in `src/pages/partner/` and use `usePartner*` hooks from
  `src/lib/partner-hooks.ts`. They are view-only.
- **Money wording.** "Ticket sales (your kita)" is fares only. The ₱5
  SeatPass fee is shown separately as paid by passengers on top. Refunds sit
  apart and are never subtracted from ticket sales. Formatters are in
  `src/lib/format.ts` (`peso`, `dateTime`, Manila dates).
- **Widgets.** `StatTile` and `LoadBar` (`src/components/partner/widgets.tsx`).
  `LoadBar` turns amber at 85% or more.
- **Staff accounts** are managed by admins on the operator's detail page
  (`OperatorStaffCard`). The temporary password shows once.

## Earnings (2026-10-23)

`/earnings` (Finance) is SeatPass's own income: the booking fee per paid
reservation, beside "Collected from passengers" and "Fares owed to bus
companies", with a per-company table and CSV. The dashboard's old "Revenue"
tile was everything passengers paid, so it now reads "Collected from
passengers". The date range controls are shared with the partner Sales page
(`RangeControls` + `useSalesRange` in `src/components/partner/`).

## Next candidates

- Show operator logos in the Operators and Buses tables.
- Add a dark mode (`darkMode: "class"` is already configured).
- Code-split the bundle: the build warns about one chunk over 500 kB
  (MapLibre and Recharts).
