# Sefinet Al Neja — M01 Frontend Agent Prompt
## User & Role Management — Frontend Only
**Status:** Backend ✅ Complete | Frontend ❌ Not Started
**Version:** 1.0

---

## CONTEXT

The backend for M01 is fully implemented at:
```
backend/src/modules/m01-auth/
  ├── auth.controller.ts   ✅ done
  ├── auth.service.ts      ✅ done
  ├── auth.routes.ts       ✅ done
  └── auth.schema.ts       ✅ done
```

Your job is to build **only the frontend** for M01.
Do not touch the backend. Do not modify any backend files.

---

## STEP 1 — READ FIRST (mandatory before any code)

Read all of these before writing a single line:

- [ ] `Sefinet-Agent-Rules.md` — your operating law
- [ ] `Sefinet-Master-Project-Spec.md` — full system spec
- [ ] `docs/architecture.md`
- [ ] `docs/api-standards.md`
- [ ] `docs/01-user-auth.md`
- [ ] `backend/src/modules/m01-auth/auth.routes.ts` — know every endpoint
- [ ] `backend/src/modules/m01-auth/auth.schema.ts` — know every request shape
- [ ] `backend/src/modules/m01-auth/auth.controller.ts` — know every response shape

**Do not proceed until you have read all of the above.**
If any file is missing, stop and ask.

---

## STEP 2 — UNDERSTAND THE BACKEND API

Before building UI, map every available endpoint:

```
POST   /api/v1/auth/login              → login with phone/email + password
POST   /api/v1/auth/logout             → revoke refresh token
POST   /api/v1/auth/refresh            → rotate refresh token, get new access token
POST   /api/v1/auth/forgot-password    → send reset email
POST   /api/v1/auth/reset-password     → confirm reset with token + new password
GET    /api/v1/auth/me                 → get own profile + role + medresa assignments

GET    /api/v1/users                   → list all users (Super Admin only)
POST   /api/v1/users                   → create user (Super Admin only)
PATCH  /api/v1/users/:id               → edit user (Super Admin only)
PATCH  /api/v1/users/:id/deactivate    → deactivate user (Super Admin only)
PATCH  /api/v1/users/:id/reactivate    → reactivate user (Super Admin only)
```

Confirm every endpoint works (test with curl or Postman)
before building UI that depends on it.
If any endpoint is missing or broken — stop and report it.

---

## STEP 3 — FOLDER STRUCTURE

Your work lives entirely inside:
```
frontend/src/features/auth/
  ├── components/
  │   ├── LoginForm.tsx
  │   ├── ForgotPasswordForm.tsx
  │   ├── ResetPasswordForm.tsx
  │   ├── UserList.tsx
  │   ├── UserCard.tsx
  │   ├── CreateUserModal.tsx
  │   ├── EditUserModal.tsx
  │   ├── DeactivateUserDialog.tsx
  │   └── UserRoleBadge.tsx
  ├── hooks/
  │   ├── useAuth.ts           ← TanStack Query auth hooks
  │   ├── useUsers.ts          ← TanStack Query user CRUD hooks
  │   └── useCurrentUser.ts    ← current user + role resolution
  ├── pages/
  │   ├── LoginPage.tsx
  │   ├── ForgotPasswordPage.tsx
  │   ├── ResetPasswordPage.tsx
  │   └── UserManagementPage.tsx
  ├── schemas/
  │   └── auth.schemas.ts      ← Zod form validation schemas
  ├── types/
  │   └── auth.types.ts        ← TypeScript types
  └── index.ts                 ← public exports
```

Also create/update:
```
frontend/src/routes/
  ├── _public.tsx              ← public layout (login, reset)
  ├── _protected.tsx           ← protected layout (auth required)
  ├── index.tsx                ← root redirect by role
  └── auth/
      ├── login.tsx
      ├── forgot-password.tsx
      └── reset-password.tsx
```

Do not create files anywhere else.

---

## STEP 4 — FEATURES TO BUILD (in this exact order)

---

### Feature 1: Auth State Foundation

**What:** Global auth state management using TanStack Query.

**Files to create:**
- `hooks/useCurrentUser.ts`
- `hooks/useAuth.ts`
- `types/auth.types.ts`

**Requirements:**

```typescript
// auth.types.ts — define these types based on backend responses
type User = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

type MedresaRole = {
  medresaId: string;
  medresaName: string;
  role: 'TEACHER' | 'ADMIN';
}

type CurrentUser = User & {
  medresaRoles: MedresaRole[];
  // derived helpers
  isMedresaAdmin: boolean;   // has any ADMIN role
  isTeacher: boolean;        // has any TEACHER role
}

type AuthTokens = {
  accessToken: string;
  // refresh token is httpOnly cookie — not in response body
}
```

```typescript
// useCurrentUser.ts
// - Calls GET /api/v1/auth/me
// - Stores result in TanStack Query cache with key ['currentUser']
// - Stale time: 5 minutes
// - On 401: clear cache, redirect to login
// - Exposes: currentUser, isLoading, isAuthenticated
// - Must be the single source of truth for auth state
```

```typescript
// useAuth.ts
// - login(identifier, password): POST /api/v1/auth/login
//   On success: store access token, invalidate ['currentUser'] query
// - logout(): POST /api/v1/auth/logout
//   On success: clear access token, clear query cache, redirect to login
// - Access token storage: memory only (NOT localStorage, NOT sessionStorage)
//   Use a module-level variable or Zustand store
```

**⚠️ HIGH-ALERT — Token Storage Security:**
- Access token must NEVER be stored in localStorage or sessionStorage
- Store access token in memory only (module variable or Zustand)
- Refresh token is httpOnly cookie — the browser handles it automatically
- On page refresh: call /api/v1/auth/refresh to get new access token
  using the httpOnly cookie — if it fails, user must log in again

**Tests:**
- useCurrentUser returns user data on valid token
- useCurrentUser redirects to login on 401
- login stores token in memory (not localStorage)
- logout clears token and cache

**Report when complete.**

---

### Feature 2: Axios Instance + Interceptors

**What:** Configured Axios instance that handles token attachment
and automatic refresh on 401.

**File:** `frontend/src/lib/axios.ts`

**Requirements:**

```typescript
// Single Axios instance used by ALL TanStack Query hooks
// Base URL: import.meta.env.VITE_API_URL + '/api/v1'

// Request interceptor:
// - Attach access token from memory to Authorization header
// - Format: "Bearer <token>"

// Response interceptor:
// - On 401: attempt POST /api/v1/auth/refresh (httpOnly cookie sent automatically)
// - If refresh succeeds: store new access token, retry original request
// - If refresh fails: clear token, redirect to /login
// - Prevent infinite refresh loops (track retry flag)

// All TanStack Query hooks must import this instance
// Never use plain fetch() anywhere in the frontend
```

**Tests:**
- Request has Authorization header when token exists
- 401 triggers refresh attempt
- Failed refresh redirects to login
- Successful refresh retries original request

**Report when complete.**

---

### Feature 3: Route Setup + Auth Guards

**What:** TanStack Router configuration with public and
protected route layouts.

**Files to create/update:**
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/_public.tsx`
- `frontend/src/routes/_protected.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routes/auth/login.tsx`
- `frontend/src/routes/auth/forgot-password.tsx`
- `frontend/src/routes/auth/reset-password.tsx`

**Requirements:**

```
Public routes (no auth required):
  /login
  /forgot-password
  /reset-password?token=...

Protected routes (auth required):
  /super-admin/*   → only accessible to isSuperAdmin = true
  /admin/*         → only accessible to isMedresaAdmin = true
  /teacher/*       → only accessible to isTeacher = true

Root redirect logic (GET /):
  If not authenticated → /login
  If super_admin → /super-admin/dashboard
  If medresa_admin → /admin/dashboard
  If teacher → /teacher/dashboard

Auth guard behavior:
  - Check useCurrentUser().isAuthenticated
  - If loading: show full-page skeleton loader
  - If not authenticated: redirect to /login
  - If wrong role: redirect to correct dashboard
```

**Tests:**
- Unauthenticated user visiting /admin → redirected to /login
- Super admin visiting /teacher → redirected to /super-admin/dashboard
- Authenticated user visiting /login → redirected to their dashboard
- Loading state shows skeleton, not blank page

**Report when complete.**

---

### Feature 4: Login Page

**What:** Login screen — the entry point for all users.

**Files:**
- `pages/LoginPage.tsx`
- `components/LoginForm.tsx`
- `schemas/auth.schemas.ts` (start with loginSchema)

**UI Requirements:**

```
Layout:
  - Centered card on full-page background
  - HMMS logo / name at top
  - Subtitle in Amharic and Arabic below English
  - Language switcher (EN / AM / AR) top right

Form fields:
  - "Phone or Email" input (single field, auto-detect)
  - Password input with show/hide toggle
  - "Forgot Password?" link below password field
  - "Sign In" submit button (full width)
  - Loading spinner on submit button while logging in

Validation (Zod schema — client side):
  - Identifier: required, min 3 chars
  - Password: required, min 8 chars
  - Show inline error messages below each field

Success behavior:
  - Call login() from useAuth
  - On success: redirect by role (handled by route guard)

Error behavior:
  - 401 → "Invalid credentials. Please try again." (generic)
  - 403 → "Your account has been deactivated."
  - Network error → "Connection error. Please try again."
  - Never show technical error details to user

RTL support:
  - When Arabic selected: flip layout direction (dir="rtl")
  - All labels and inputs adjust to RTL
```

**Zod Schema:**
```typescript
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

**Tests:**
- Form renders correctly
- Validation errors show on submit with empty fields
- Successful login redirects to correct dashboard by role
- Wrong credentials shows generic error (not technical)
- Deactivated account shows deactivation message
- Loading state disables submit button

**Report when complete.**

---

### Feature 5: Forgot Password Page

**What:** Email submission form for password reset.

**Files:**
- `pages/ForgotPasswordPage.tsx`
- `components/ForgotPasswordForm.tsx`
- Add `forgotPasswordSchema` to `schemas/auth.schemas.ts`

**UI Requirements:**

```
Layout:
  - Same centered card as login
  - "Back to Login" link at top

Form fields:
  - Email input
  - "Send Reset Link" button

Success state (after submit):
  - Hide form
  - Show success message:
    "If this email is registered, you will receive
     a password reset link shortly."
  - Show this message whether email exists or not
    (prevents user enumeration — matches backend behavior)
  - "Back to Login" button

Error state:
  - Network error only → "Something went wrong. Please try again."
  - Never reveal whether email exists or not
```

**Tests:**
- Valid email → shows success message
- Unknown email → same success message (no enumeration)
- Invalid email format → inline validation error
- Network error → error message shown

**Report when complete.**

---

### Feature 6: Reset Password Page

**What:** New password form — accessed via email link.

**Files:**
- `pages/ResetPasswordPage.tsx`
- `components/ResetPasswordForm.tsx`
- Add `resetPasswordSchema` to `schemas/auth.schemas.ts`

**UI Requirements:**

```
URL: /reset-password?token=<token>

On page load:
  - Extract token from URL query param
  - If no token: redirect to /forgot-password immediately

Form fields:
  - New Password (min 8 chars, with strength indicator)
  - Confirm Password (must match)
  - "Set New Password" button

Success state:
  - "Your password has been reset successfully."
  - "Sign In" button → /login

Error states:
  - 400 (expired token): "This reset link has expired.
    Please request a new one." + link to /forgot-password
  - 400 (used token): "This reset link has already been used.
    Please request a new one." + link to /forgot-password
  - Passwords don't match: inline validation error
```

**Tests:**
- No token in URL → redirect to /forgot-password
- Valid token + matching passwords → success screen
- Expired token → expired error message
- Used token → already used message
- Passwords don't match → validation error

**Report when complete.**

---

### Feature 7: User Management Page (Super Admin only)

**What:** Full user list with create/edit/deactivate actions.

**Files:**
- `pages/UserManagementPage.tsx`
- `components/UserList.tsx`
- `components/UserCard.tsx`
- `components/CreateUserModal.tsx`
- `components/EditUserModal.tsx`
- `components/DeactivateUserDialog.tsx`
- `components/UserRoleBadge.tsx`
- `hooks/useUsers.ts`
- Add `createUserSchema`, `editUserSchema` to `schemas/auth.schemas.ts`

**TanStack Query Hooks (useUsers.ts):**

```typescript
// useUserList(filters) → GET /api/v1/users with pagination + filters
// useCreateUser() → POST /api/v1/users mutation
// useEditUser() → PATCH /api/v1/users/:id mutation
// useDeactivateUser() → PATCH /api/v1/users/:id/deactivate mutation
// useReactivateUser() → PATCH /api/v1/users/:id/reactivate mutation
// All mutations invalidate ['users'] query on success
```

**User List UI:**
```
Table columns:
  - Avatar / initials circle
  - Full Name
  - Phone
  - Email
  - Assigned Medresas (pill badges, max 3 shown then "+N more")
  - Role per Medresa (UserRoleBadge component)
  - Status (Active / Inactive — colored badge)
  - Actions (Edit, Deactivate/Reactivate)

Filters bar:
  - Search by name/email/phone
  - Filter by status (All / Active / Inactive)
  - Filter by medresa (dropdown)

Pagination:
  - Cursor-based, 20 per page
  - "Load more" or page numbers

Empty state:
  - Illustrated empty state with "No users found"

Loading state:
  - Skeleton rows while loading
```

**Create User Modal:**
```
Fields:
  - Full Name (required)
  - Phone Number (required, Ethiopian format)
  - Email (required)
  - Note: password auto-generated, reset email sent automatically
    → show info message: "A password reset email will be sent
       to the user automatically."

On success:
  - Close modal
  - Show toast: "User created. Password reset email sent."
  - Refresh user list
```

**Edit User Modal:**
```
Same fields as create
Pre-filled with current values
On success: toast "User updated successfully."
```

**Deactivate User Dialog:**
```
Confirmation dialog:
  "Deactivate [User Name]?
   They will lose all system access immediately.
   Their historical data will be preserved."

Buttons: "Cancel" | "Deactivate" (red, destructive)
On success: toast "User deactivated."
On reactivate: same pattern, green confirm button
```

**UserRoleBadge Component:**
```
Props: { role: 'TEACHER' | 'ADMIN', medresaName: string }
ADMIN → blue badge "Admin · Medresa Name"
TEACHER → gray badge "Teacher · Medresa Name"
```

**Tests:**
- User list renders with data
- Filter by status works
- Search filters list correctly
- Create user → success toast, list refreshes
- Create user with duplicate email → inline error
- Edit user → modal pre-filled, success toast
- Deactivate user → confirmation dialog, then deactivated
- Deactivated user shows "Reactivate" action instead
- Non-super-admin visiting this page → 403 or redirect

**Report when complete.**

---

### Feature 8: Own Profile View

**What:** Every user can view their own profile.
Accessible from the top nav.

**Files:**
- `components/ProfileCard.tsx`
- Reuse `hooks/useCurrentUser.ts` (already built in Feature 1)

**UI Requirements:**
```
Displays:
  - Full name
  - Phone
  - Email
  - Status badge
  - List of medresa assignments with role badge per medresa

Note: Editing own profile is done by Super Admin only
      (via User Management page). This is read-only.

Location: accessible from top navigation bar user menu
```

**Tests:**
- Profile shows correct user data
- Medresa assignments listed with correct roles

**Report when complete.**

---

## DEFINITION OF DONE FOR M01 FRONTEND

M01 Frontend is complete when ALL of the following are true:

- [ ] All 8 features built and functional
- [ ] Access token stored in memory only (never localStorage)
- [ ] Axios interceptor handles 401 + auto-refresh
- [ ] Route guards working for all 3 roles
- [ ] Login redirects correctly by role
- [ ] Forgot/reset password flow works end to end
- [ ] User management CRUD works for Super Admin
- [ ] All forms use React Hook Form + Zod
- [ ] All data fetching uses TanStack Query
- [ ] All text strings go through i18next (no hardcoded strings)
- [ ] Arabic language triggers RTL layout on login page
- [ ] Loading states on all data-fetching components
- [ ] Error states on all data-fetching components
- [ ] Empty states on list components
- [ ] All tests passing
- [ ] No `any` TypeScript types
- [ ] `docs/01-user-auth.md` updated with frontend component list
- [ ] Progress reported after every feature

---

## IMPORTANT REMINDERS

- **Token security:** Access token in memory only. This is non-negotiable.
- **No hardcoded strings:** Every label, error, and message goes through i18next
- **Ethiopian calendar:** Not needed for M01 (no date display in auth module)
- **Monetary amounts:** Not needed for M01
- **Soft delete:** Not applicable for M01 frontend (backend handles it)
- **Module boundary:** Do not touch any other feature folder

---

*M01 Frontend Agent Prompt v1.0*
*Backend: ✅ Complete | Frontend: ❌ Your job*
*When in doubt: stop, document, ask.*
