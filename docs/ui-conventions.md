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
3. **`PageBody`** ([`PageBody.tsx`](frontend/src/components/layout/PageBody.tsx)): scrollable content with standard horizontal padding. Use **`fullWidth`** when the page needs full-bleed tables or wide grids (e.g. network attendance).

Avoid wrapping feature pages in `min-h-screen bg-cream` — the shell and `PageBody` own the canvas.

## Reusable building blocks

- **[`StatCard`](frontend/src/components/ui/StatCard.tsx)**: KPI tiles (e.g. medresa network overview).
- **[`FilterTabs`](frontend/src/components/ui/FilterTabs.tsx)**: pill/tab filters shared across list pages.
- **[`ContentCard`](frontend/src/components/ui/ContentCard.tsx)**: default object/list row container.

## Design tokens

Sidebar and shell colors live under `@theme` in [`frontend/src/index.css`](frontend/src/index.css) (`--color-sidebar`, `--color-surface`, `--color-canvas`, etc.). Prefer those over raw hex in components.

## Auth / marketing pages

Login, forgot password, and reset flows keep their own full-page branding (e.g. `GeometricPattern`) and do **not** use `AppShell`.
