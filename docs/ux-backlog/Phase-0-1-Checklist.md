# Phase 0 & 1 — UX Implementation Checklist

**Started:** 2026-06-14  
**Scope:** Foundation primitives + daily workflow improvements (UX-MA-02, UX-MA-03, UX-MA-06, attendance UX)

---

## Phase 0 — Foundation primitives

### Shared UI components
- [x] `Modal` — dialog semantics, focus trap, Escape, backdrop, scroll lock
- [x] `ConfirmDialog` — destructive/warning confirms on top of Modal
- [x] `Field` — label + input with `htmlFor`, `aria-describedby`, `aria-invalid`
- [x] `ErrorState` — illustrated error with retry + back
- [x] `ToastProvider` + `useToast` — success/error/info feedback

### App wiring
- [x] Mount `ToastProvider` in `App.tsx`
- [x] Export primitives from `components/ui/` for feature use

### i18n & error surfaces
- [x] Medresa module strings (`MedresaList`, `MedresaFormFields`, create/edit/deactivate modals)
- [x] `RouteErrorBoundary` translated
- [x] Root router error component translated
- [x] `AppErrorBoundary` translated (wrapper pattern)
- [x] Keys in `en.json`, `am.json`, `ar.json`

### Medresa modals migration (reference implementation)
- [x] `CreateMedresaModal` → Modal + toast
- [x] `EditMedresaModal` → Modal + toast
- [x] `DeactivateMedresaDialog` → ConfirmDialog + toast
- [x] `MedresaList` → EmptyState + i18n

---

## Phase 1 — Daily workflow

### UX-MA-02 — Dashboard command center
- [x] Alert cards: pending grade edits, outstanding fees, incomplete attendance
- [x] Each alert deep-links with sensible filters
- [x] Course table rows clickable → course workspace
- [x] Empty course table uses `EmptyState` (not hidden)
- [x] i18n keys for alert copy

### UX-MA-03 — Course workspace
- [x] Tab type + URL param `?tab=overview|roster|attendance|results|teacher`
- [x] `CourseHubTabs` component (FilterTabs pattern)
- [x] Overview tab: course meta summary
- [x] Roster tab: filtered students list
- [x] Attendance tab: today status + take roll links
- [x] Results tab: embedded class results (no `/teacher/courses/results` for admins)
- [x] Teacher tab: assign/change teacher
- [x] Router `validateSearch` includes `tab`

### UX-MA-06 — Multi-medresa context safety
- [x] Persist selected `medresaId` in `localStorage`
- [x] `MedresaContextBar` in shell when multi-medresa admin
- [x] Sidebar nav retains `medresaId` on scoped routes
- [x] `MedresaPicker` updates current route search (not always `/medresa/courses`)
- [x] Write confirms show medresa name (transfer modal)

### Attendance UX
- [x] Default new rows to `PRESENT` (not `ABSENT`)
- [x] Confirm dialog when submitting with high absent count
- [x] Success toast after save
- [x] Error toast on failure

---

## Verification

- [x] `npm run build` passes
- [ ] Manual: medresa admin dashboard alerts navigate correctly
- [ ] Manual: course hub tabs deep-link
- [ ] Manual: switch medresa → sidebar links keep context
- [ ] Manual: take attendance → toast on success

---

## Out of scope (Phase 2+)

- Mobile table cards everywhere
- Full-app i18n audit (remaining modals)
- PWA manifest
- Academics nav merge (UX-MA-04)
- Migrate all 19 modals to shared `Modal` primitive
