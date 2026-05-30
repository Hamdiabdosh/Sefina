# UI layout conventions (Sefinet frontend)

This document describes how authenticated pages should be structured after the unified app shell rollout.

## Canvas and surfaces

- **Body / main column background**: use the `bg-canvas` token (same as `cream` in [`frontend/src/index.css`](frontend/src/index.css)). This is the default scroll area behind content.
- **Cards and panels**: use white/surface panels (`bg-surface`, `border-cream-dark`, `rounded-xl`) for grouped content. Prefer the shared [`ContentCard`](frontend/src/components/ui/ContentCard.tsx) when the pattern matches.

## App shell

- **Sidebar**: role-based sections are defined in [`frontend/src/components/layout/navConfig.ts`](frontend/src/components/layout/navConfig.ts). Route access is still enforced in [`frontend/src/router.tsx`](frontend/src/router.tsx); the sidebar only reflects navigation. On `md` and up, the sidebar is **`position: fixed`** to the viewport (`h-dvh`); long nav lists scroll inside the sidebar only, while page content scrolls in the main column (`md:pl-[220px]` offsets the fixed rail).
- **Mobile**: below the `md` breakpoint, navigation opens as an overlay drawer launched from the top bar ([`MobileShellBar`](frontend/src/components/layout/SidebarNav.tsx)).

## Page structure

Each route under the protected layout should render:

1. A **single column flex root**: `className="flex min-h-0 flex-1 flex-col"` (optionally with bottom padding if using fixed FABs).
2. **`PageTopBar`** ([`PageTopBar.tsx`](frontend/src/components/layout/PageTopBar.tsx)): title, optional subtitle, optional `onBack`, optional `actions` (search, primary buttons).
3. **`PageBody`** ([`PageBody.tsx`](frontend/src/components/layout/PageBody.tsx)): scrollable content with `max-w-7xl`, responsive padding (`px-4 sm:px-6 lg:px-8 py-6`), and default `space-y-8` between direct children. Use **`fullWidth`** to drop the max-width cap while keeping the same padding (e.g. network attendance, dashboards with `className="max-w-none"`).

4. **`PageSectionHeader`** ([`PageSectionHeader.tsx`](frontend/src/components/layout/PageSectionHeader.tsx)) — optional, **inside** `PageBody` only: large in-page section titles (reports blocks, dashboard subsections). Do **not** replace `PageTopBar` on list routes.

Avoid wrapping feature pages in `min-h-screen bg-cream` — the shell and `PageBody` own the canvas.

## Student hub (Medresa Admin / Teacher)

- **`/medresa/students/$studentId`** uses tabbed panels under `frontend/src/features/students/components/hub/`.
- Deep-link with `?tab=profile|courses|attendance|grades|fees` (fees tab only for Medresa Admin / Super Admin).
- Legacy `/results` and `/fees` routes redirect to the hub.

## Reusable building blocks

- **[`StatCard`](frontend/src/components/ui/StatCard.tsx)**: KPI tiles (e.g. medresa network overview).
- **[`FilterTabs`](frontend/src/components/ui/FilterTabs.tsx)**: pill/tab filters shared across list pages.
- **[`ContentCard`](frontend/src/components/ui/ContentCard.tsx)**: default object/list row container (uses global `.card` in CSS).
- **[`EmptyState`](frontend/src/components/ui/EmptyState.tsx)**: centered empty list/report placeholder with icon, title, and optional CTA.
- **[`DataTable`](frontend/src/components/ui/DataTable.tsx)**: zebra-striped table wrapper with optional `mobileFallback` card list.

Global component classes (`.card`, `.btn`, `.skeleton`, `.focus-ring`) live in [`frontend/src/index.css`](../frontend/src/index.css). Auth forms keep full-width `.btn-primary`; in-app actions use `.btn-primary-inline` or `.btn-primary-compact`.

## Design tokens

Sidebar and shell colors live under `@theme` in [`frontend/src/index.css`](frontend/src/index.css) (`--color-sidebar`, `--color-surface`, `--color-canvas`, etc.). Prefer those over raw hex in components.

## Auth / marketing pages

- **`/` (logged out):** public marketing page ([`MarketingPage`](../frontend/src/features/marketing/pages/MarketingPage.tsx)) — hero, feature cards, sign-in CTA. Logged-in users redirect to their role home.
- **Shared Islamic UI:** [`frontend/src/components/islamic/`](../frontend/src/components/islamic/) — `OrnateCard`, `MarketingHero`, `BlessingFooter`, `GeometricDivider`; tokens in [`frontend/src/index.css`](../frontend/src/index.css).
- Login, forgot password, and reset flows keep their own full-page branding (e.g. `GeometricPattern`, `MarketingHero` auth variant) and do **not** use `AppShell`.
- The former standalone CRA landing app was removed in repo cleanup; marketing UI lives in `frontend/src/features/marketing/`.

## Keyboard shortcuts (authenticated app)

Global bindings are active inside `AppShell` (see [`keyboardShortcuts.ts`](../frontend/src/config/keyboardShortcuts.ts)):

| Keys | Action |
|------|--------|
| `?` | Open shortcuts help |
| `/` or `Ctrl+K` | Focus list search (medresas, teachers, students pages) |
| `P` | Open profile |
| `Esc` | Close profile, mobile menu, or help panel |
| `G` then letter | Navigate (role-specific; e.g. `G` `D` → dashboard) |

Sidebar shows a reminder: “Press ? for keyboard shortcuts”.
