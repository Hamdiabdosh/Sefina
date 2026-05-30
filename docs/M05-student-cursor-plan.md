# M05 Student Management — Cursor Implementation Plan

> **Philosophy:** Every change is additive or a drop-in replacement. Nothing removes existing
> functionality. Each task is self-contained so you can stop at any point and the app is still
> fully working.

---

## How to use this with Cursor

Open each task as its own Cursor chat. Paste the **"Cursor prompt"** block verbatim, then let
Cursor write the diff. Review, test, commit. Move to the next task.

Tasks are ordered by impact-to-risk ratio: highest value, lowest breakage risk first.

---

## Task 1 — EmptyState component + wire it into students list

**What:** Replace the bare `<p>` empty state in `MedresaStudentsPage` with a proper reusable
component that includes an icon, heading, body text, and an optional CTA button.

**Files touched:**
- `frontend/src/components/ui/EmptyState.tsx` ← new file
- `frontend/src/features/students/pages/MedresaStudentsPage.tsx` ← swap the `<p>` line

**Cursor prompt:**
```
Create a new file frontend/src/components/ui/EmptyState.tsx.
The component accepts: icon (ReactNode), title (string), body (string, optional),
action (ReactNode, optional). Style it consistently with the existing design system:
bg-surface, border-cream-dark, rounded-xl, teal colour tokens, muted-foreground text.

Then in MedresaStudentsPage.tsx replace:
  <p className="py-12 text-center text-muted-foreground">{t('students.empty')}</p>
with an <EmptyState> that uses a Users icon from lucide-react, title t('students.empty'),
and an action button that calls setShowEnroll(true) labelled t('students.enroll').
Do not change anything else in the file.
```

**i18n additions needed** (add to all three locale files):
```json
"students": {
  "emptyHint": "Enroll the first student to get started."
}
```

---

## Task 2 — Guardian phone "tap to copy" in list view

**What:** In the table view of `MedresaStudentsPage`, make the guardian phone number a
click-to-copy button. Zero backend change.

**Files touched:**
- `frontend/src/features/students/pages/MedresaStudentsPage.tsx`

**Cursor prompt:**
```
In MedresaStudentsPage.tsx, in the table row <td> that renders student.guardianPhone
(currently in the hidden lg:table-cell column labelled t('students.guardian')):

Replace the plain text with a button that:
1. Copies student.guardianPhone to the clipboard using navigator.clipboard.writeText
2. Shows a brief "Copied!" tooltip for 1.5 seconds using a local useState per row
   (or a shared copiedId state at page level — whichever is cleaner)
3. Shows a Phone icon from lucide-react next to the number
4. Has cursor-pointer and a hover:text-teal-600 style

Do not change anything outside this column. Do not touch the list (card) view.
```

---

## Task 3 — Status badge colours (table + list view)

**What:** The current status badge only distinguishes ACTIVE vs. everything else. Add distinct
colours for TRANSFERRED (amber), WITHDRAWN (red-ish), GRADUATED (teal-dark).

**Files touched:**
- `frontend/src/features/students/pages/MedresaStudentsPage.tsx`

**Cursor prompt:**
```
In MedresaStudentsPage.tsx there are two places that render a status badge
(one in the table <td>, one in the list <button>). Both use a ternary that only
checks for 'ACTIVE'. 

Extract a helper function getStatusBadgeClass(status: StudentStatus): string at the
top of the file that returns:
- 'ACTIVE'      → 'bg-teal-50 text-teal-600'
- 'TRANSFERRED' → 'bg-amber-50 text-amber-600'
- 'WITHDRAWN'   → 'bg-red-50 text-red-500'
- 'GRADUATED'   → 'bg-teal-100 text-teal-800'

Replace both ternary expressions with a call to this helper. Import StudentStatus
from '../types' if not already imported. No other changes.
```

---

## Task 4 — Quick-action floating button on StudentDetailPage

**What:** Add a floating action button (FAB) on mobile on the student detail page with
shortcuts: Record Payment, Add Note, Assign Course, Transfer. Each taps into existing
handlers already in the page.

**Files touched:**
- `frontend/src/features/students/pages/StudentDetailPage.tsx`

**Cursor prompt:**
```
In StudentDetailPage.tsx, add a mobile FAB (fixed bottom-right, same pattern as the
"Enroll student" FAB in MedresaStudentsPage — fixed bottom-6 right-6 z-20 rounded-full
bg-teal-600 text-white shadow-lg sm:hidden).

The FAB shows a "+" (Plus icon from lucide-react) and taps to toggle an action menu
(a small card that appears just above the FAB). The menu has up to 4 items, shown only
when isMedresaAdmin is true:

1. "Assign course"  → calls setShowAssign(true), close menu
2. "Transfer"       → calls setShowTransfer(true), close menu  
3. "Edit"           → calls setShowEdit(true), close menu

Use a local boolean state `fabOpen` to toggle the menu. Clicking outside or pressing
Escape should close it (add a simple useEffect with a document click listener that
closes when fabOpen is true).

Style the menu items consistently with existing btn-secondary patterns.
Only render the FAB when isMedresaAdmin is true.
Do not change any desktop layout.
```

---

## Task 5 — Ethiopian name fields (frontend only, opt-in)

**What:** Add optional `fullNameAm` (Amharic) and `fullNameAr` (Arabic) fields to the
enrollment and edit forms. Backend schema already has the `full_name` field; these are
stored as extra metadata or can wait for a backend migration (see note below). For now,
add them as optional display-only fields in the profile tab.

> **Backend note:** If you want to persist these, run a Prisma migration:
> ```
> full_name_am  String?
> full_name_ar  String?
> ```
> and update `studentProfileFields()` in `student.service.ts` and `mapStudentDetail()`
> in `student.mapper.ts`. The frontend tasks below work even without this migration if
> you skip the form/save parts and only add the display fields.

**Frontend — display only (safe, zero migration needed):**

Add to `StudentDetail` type in `frontend/src/features/students/types/index.ts`:
```ts
fullNameAm?: string | null;
fullNameAr?: string | null;
```

Add to `StudentProfileTab.tsx` after the main name (which is the `PageTopBar` title):
```tsx
{student.fullNameAr && (
  <p className="text-base font-arabic text-teal-700 mt-0.5">{student.fullNameAr}</p>
)}
{student.fullNameAm && (
  <p className="text-sm text-muted-foreground">{student.fullNameAm}</p>
)}
```

**Cursor prompt (display only):**
```
In frontend/src/features/students/types/index.ts add two optional fields to StudentDetail:
  fullNameAm?: string | null;
  fullNameAr?: string | null;

In StudentProfileTab.tsx, inside the first <section> after the StudentAvatar, add
two conditionally-rendered paragraphs:
- if student.fullNameAr exists: render it in a <p dir="rtl"> with text-teal-700
- if student.fullNameAm exists: render it in a <p> with text-muted-foreground text-sm

No other changes. The fields will be null/undefined until backend migration is added.
```

---

## Task 6 — Multi-step enrollment wizard (modal upgrade)

**What:** The current `EnrollStudentModal` is a single-step form. Upgrade it to a 2-step
wizard:
- Step 1: Personal info (fullName, dateOfBirth, gender, address) + photo
- Step 2: Guardian info (guardianName, guardianPhone) + review summary

This is a **drop-in replacement** of `EnrollStudentModal.tsx` only. The `createStudent`
mutation call and all validation stay identical.

**Files touched:**
- `frontend/src/features/students/components/EnrollStudentModal.tsx`

**Cursor prompt:**
```
Rewrite EnrollStudentModal.tsx as a 2-step wizard modal. Keep the same Props type,
the same useForm/zodResolver/studentFormSchema setup, and the same createStudent.mutate
call on final submit. Change nothing outside this file.

Step layout:
- A step indicator at the top (two dots or "Step 1 of 2 / Step 2 of 2" text)
- Step 1: fullName, dateOfBirth, gender, address fields + photo file input
  (use the existing StudentFormFields split: render only the first 4 fields manually,
  not the guardian fields)
- Step 2: guardianName, guardianPhone fields + a read-only summary card showing the
  name and DOB from step 1
- "Next" button on step 1 (validate only step-1 fields before proceeding using
  trigger(['fullName','dateOfBirth','gender','address']))
- "Back" and "Enroll" buttons on step 2
- Keep the existing error display and loading state on the final submit button

Style consistently with the existing modal (rounded-xl, teal-800 heading, space-y-4,
field-input, btn-primary, btn-secondary).
```

---

## Task 7 — Student profile completeness indicator

**What:** A small progress bar / score on the `StudentProfileTab` showing how complete the
profile is. Encourages admins to fill in secondary guardian, national ID, blood group, etc.

**Files touched:**
- `frontend/src/features/students/components/hub/StudentProfileTab.tsx`

**Cursor prompt:**
```
In StudentProfileTab.tsx add a "Profile completeness" section at the very top of the
returned JSX (above the existing avatar section).

Compute a score from the StudentDetail object:
- fullName present → +1
- dateOfBirth present → +1
- address present → +1
- guardianPhone present → +1
- guardianName present → +1
- secondaryGuardianName present → +1
- nationalId present → +1
- bloodGroup present → +1
- photoUrl present → +1

Total = 9 points. Show:
- A label "Profile {{pct}}% complete" (where pct = Math.round(score/9*100))
- A thin progress bar (h-1.5 rounded-full bg-cream-dark with an inner div whose
  width is set to `${pct}%` and bg-teal-500)
- If pct < 100: a small hint "Add secondary guardian, national ID, or blood group
  to complete the profile" in muted-foreground text-xs

Do not add any new fields to the form — this is display only.
Use t() for all strings (add the keys to locales manually after).
```

**i18n additions:**
```json
"students": {
  "profileComplete": "Profile {{pct}}% complete",
  "profileCompleteHint": "Add secondary guardian, national ID, or blood group to complete this profile."
}
```

---

## Task 8 — Transfer history timeline (visual upgrade)

**What:** Replace the plain `<ul>` transfer history list in `StudentProfileTab` with a proper
visual timeline.

**Files touched:**
- `frontend/src/features/students/components/hub/StudentProfileTab.tsx`

**Cursor prompt:**
```
In StudentProfileTab.tsx, replace the transfer history <ul> with a vertical timeline.
Each timeline item should show:
- A small circle dot on the left (bg-teal-400 w-2 h-2 rounded-full)
- A vertical line connecting items (border-l-2 border-cream-dark ml-[3px])
- Right side: "From: {fromMedresaName}" and "To: {toMedresaName}" labels, the transfer
  date formatted as toLocaleDateString(), and the reason if it exists
- An ArrowRight icon from lucide-react between the from/to names

Keep the same section wrapper and heading. No other changes to the file.
```

---

## Task 9 — Bulk export (frontend stub → real CSV)

**What:** Add an "Export" button to `MedresaStudentsPage` that downloads the currently
filtered student list as a CSV. Uses the data already fetched by `useStudents` — no new
API endpoint needed.

**Files touched:**
- `frontend/src/features/students/pages/MedresaStudentsPage.tsx`

**Cursor prompt:**
```
In MedresaStudentsPage.tsx add an "Export CSV" button next to the "Enroll student"
button in the PageTopBar actions (desktop) and as a secondary FAB or menu item on mobile.

The button should:
1. Be disabled while isLoading is true
2. On click, generate a CSV string from the `students` array with columns:
   Enrollment Number, Full Name, Gender, Status, Guardian Name, Guardian Phone, Courses
   (courses joined by " | "), Enrolled At
3. Use getLocalizedValue() for course names (import it from teachers utils)
4. Create a Blob and trigger a download via a temporary <a> tag with
   href=URL.createObjectURL(blob) and download="students-export.csv"
5. Use the Download icon from lucide-react on the button

Add no new state. Only add the button and the download handler function.
Import getLocalizedValue from '../../teachers/utils/localizedJson' if not already imported.
```

---

## Task 10 — Backend: Ethiopian name fields migration (optional, do last)

Only do this if you want to persist `fullNameAm` and `fullNameAr` in the database.

**Files touched:**
- `backend/prisma/schema.prisma`
- `backend/src/modules/m05-student/student.service.ts`
- `backend/src/modules/m05-student/student.mapper.ts`
- `backend/src/modules/m05-student/student.schema.ts`
- `frontend/src/features/students/schemas/student.schemas.ts`
- `frontend/src/features/students/components/StudentFormFields.tsx`

**Cursor prompt:**
```
Add optional fullNameAm (Amharic) and fullNameAr (Arabic) fields to the Student model
and wire them end-to-end.

1. In schema.prisma add to the Student model:
   full_name_am  String?
   full_name_ar  String?

2. Run: npx prisma migrate dev --name add_student_name_am_ar

3. In student.schema.ts add to CreateStudentInput and UpdateStudentInput:
   fullNameAm?: string;
   fullNameAr?: string;

4. In student.service.ts add to studentProfileFields():
   ...(input.fullNameAm !== undefined ? { full_name_am: input.fullNameAm ?? null } : {}),
   ...(input.fullNameAr !== undefined ? { full_name_ar: input.fullNameAr ?? null } : {}),

5. In student.mapper.ts add to mapStudentDetail():
   fullNameAm: s.full_name_am ?? null,
   fullNameAr: s.full_name_ar ?? null,

6. In frontend student.schemas.ts add to studentFormSchema:
   fullNameAm: z.string().max(200).optional(),
   fullNameAr: z.string().max(200).optional(),
   and update toStudentFormData() to append them if present.

7. In StudentFormFields.tsx add two optional inputs for these fields after the
   fullName field, both optional (no required validation). Label them
   t('students.form.fullNameAm') and t('students.form.fullNameAr').
   Add dir="rtl" to the Arabic input.

Do not change any other logic. All existing students will have null for these fields.
```

---

## Execution order (recommended)

| # | Task | Risk | Time |
|---|------|------|------|
| 1 | EmptyState component | Zero | 10 min |
| 2 | Guardian tap-to-copy | Zero | 10 min |
| 3 | Status badge colours | Zero | 5 min |
| 4 | Mobile FAB on detail page | Low | 20 min |
| 7 | Profile completeness bar | Zero | 15 min |
| 8 | Transfer timeline | Zero | 15 min |
| 9 | CSV export | Low | 20 min |
| 6 | Multi-step enroll wizard | Medium | 30 min |
| 5 | Ethiopian name display | Low | 15 min |
| 10 | Backend name fields migration | Medium | 20 min |

---

## What is intentionally NOT in this plan

These items from the evaluation require larger architectural decisions. Tackle them as
separate features after the above are shipped:

- **Bulk CSV/Excel import** — needs a new backend endpoint, parsing library, and error UX
- **Transfer approval flow** — needs a new DB table and notification system
- **Student ID card print/QR** — needs a PDF generation library (see the `pdf` skill)
- **Guardian portal** — separate auth scope, future phase
- **Profile photo crop** — needs a new React component (react-image-crop or similar)
