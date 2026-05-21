# Sefinet Al Neja — Agent Prompt Cards
## Ready-to-Use Prompts for Each Module Agent
**Version:** 1.0 | **Project:** Sefinet Al Neja (Harari Medresa Management System)

> Copy the relevant prompt card and paste it into your agent to start a module.
> Every agent must also receive `Sefinet-Agent-Rules.md` and `Sefinet-Master-Project-Spec.md`.

---

## FOUNDATION PROMPT (Send this to EVERY agent first)

```
You are an AI coding agent working on Sefinet Al Neja — a production-grade, multi-tenant web + PWA platform
for 20+ Islamic schools in Harari, Ethiopia.

MANDATORY READING BEFORE ANY CODE:
Read all of the following files in the project:
1. Sefinet-Agent-Rules.md         ← your operating law
2. Sefinet-Master-Project-Spec.md ← full system specification
3. prisma/schema.prisma           ← complete database schema
4. docs/ui-conventions.md         ← frontend layout and API response shape in use
5. docs/README.md                 ← doc index; read the module doc for your assignment (e.g. 06-attendance.md)

TECH STACK:
Frontend:  React + Vite + TypeScript, TanStack Router,
           TanStack Query, Shadcn/ui + Tailwind CSS,
           React Hook Form + Zod, Recharts, jsPDF, SheetJS,
           Vite PWA Plugin, i18next (Amharic/English/Arabic RTL),
           ethiopian-date, Axios

Backend:   Node.js + Express + TypeScript, JWT, Nodemailer,
           Multer, Zod, Prisma + PostgreSQL, node-cron

CORE RULES (from Sefinet-Agent-Rules.md):
- STOP AND ASK if anything is unclear — never assume or guess
- NEVER hard delete data — always soft delete (deleted_at)
- NEVER touch files outside your assigned module folder
- NEVER expose sensitive fields in API responses
- ALWAYS validate all input with Zod
- ALWAYS filter queries by deleted_at: null
- ALWAYS use medresa_id from JWT (never from request body)
- ALWAYS use Prisma select to whitelist response fields
- ALWAYS write tests before marking a feature done
- ALWAYS report after completing each feature/screen
- Enter HIGH-ALERT MODE for: security logic, financial data,
  cross-module touches, and all delete operations

After reading all required documents, confirm your understanding
and ask any questions before writing a single line of code.
```

---

## M01 — User & Role Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M01 — User & Role Management
YOUR FOLDERS:
  backend/src/modules/auth/
  frontend/src/features/auth/
  docs/01-user-auth.md

DEPENDENCY CHECK: This is a foundation module — no dependencies.
Confirm the project scaffolding (Docker, Prisma, Express app,
Vite frontend) is set up before starting.

YOUR MODULE SPEC (from Sefinet-Master-Project-Spec.md):
This module handles all authentication and user account management.
It is the foundation everything else depends on.

FEATURES TO BUILD (in this order):

Feature 1: Login Screen
- Phone or email + password authentication
- bcrypt password verification (salt rounds: 12)
- JWT access token (15min) issued on success
- JWT refresh token (7 days) set as httpOnly cookie
- Redirect by role: super_admin → /super-admin, 
  medresa_admin → /admin, teacher → /teacher
- Rate limit auth endpoints (max 10 req/min per IP)

Feature 2: Forgot Password + Reset Password Flow
- User submits email
- System generates reset token, hashes it, stores in DB
- Token expires in 1 hour, single use only
- Email sent via Nodemailer with reset link
- Reset link leads to Set New Password screen
- Generic response whether email exists or not (no enumeration)

Feature 3: Refresh Token Rotation
- Endpoint: POST /api/v1/auth/refresh
- Reads refresh token from httpOnly cookie
- Validates token (not revoked, not expired, hash matches)
- Issues new access token + rotates refresh token
- Old refresh token marked as revoked

Feature 4: Logout
- Endpoint: POST /api/v1/auth/logout
- Revokes current refresh token in DB
- Clears httpOnly cookie

Feature 5: User List Screen (Super Admin only)
- Endpoint: GET /api/v1/users
- Paginated, filterable by medresa/role/status
- Columns: full name, phone, email, assigned medresas,
  role per medresa, status
- NEVER return password_hash in response

Feature 6: Create / Edit User (Super Admin only)
- POST /api/v1/users — create user
- PATCH /api/v1/users/:id — edit user
- Auto-generate temporary password on create
- Send password reset email immediately on create
- Role assignment handled in M03 (not here)

Feature 7: Deactivate / Reactivate User (Super Admin only)
- PATCH /api/v1/users/:id/deactivate
- PATCH /api/v1/users/:id/reactivate
- Deactivation: status → INACTIVE, all sessions invalidated
- Super Admin account cannot be deactivated
- All historical data preserved (soft approach only)

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin can create/edit/deactivate accounts
BR-02: Deactivated account loses access immediately
BR-03: Historical data of deactivated teachers never deleted
BR-04: Password reset only works via email
BR-05: Reset links expire after 1 hour
BR-06: Super Admin account cannot be deactivated
BR-07: Login identifier can be phone OR email

SECURITY — YOU ARE IN HIGH-ALERT ZONE FOR THIS ENTIRE MODULE:
- bcrypt salt rounds: 12
- JWT payload: only { userId, role, isSuperAdmin } — nothing else
- Refresh token: stored hashed, httpOnly cookie, rotated every use
- Reset token: stored hashed, expires 1hr, single use
- No stack traces in error responses
- No user enumeration on forgot password
- Rate limit: 10 req/min on all auth endpoints

TESTS REQUIRED:
- Login with valid email → 200 + tokens
- Login with valid phone → 200 + tokens
- Login with wrong password → 401
- Login with inactive account → 401
- Refresh with valid token → 200 + new tokens
- Refresh with revoked token → 401
- Forgot password with unknown email → 200 (generic)
- Reset with expired token → 400
- Reset with used token → 400
- Super Admin deactivating another user → 200
- Super Admin deactivating self → 403
- Non-super-admin accessing user list → 403

Report after each feature is complete using the report format
in Sefinet-Agent-Rules.md.
```

---

## M02 — Medresa Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M02 — Medresa Management
YOUR FOLDERS:
  backend/src/modules/medresas/
  frontend/src/features/medresas/
  docs/02-medresa.md

DEPENDENCY CHECK: Confirm M01 (User & Role Management) is
fully complete and all auth middleware is working before starting.

FEATURES TO BUILD (in this order):

Feature 1: Medresa List Screen (Super Admin only)
- GET /api/v1/medresas
- Paginated, filterable by status and location
- Columns: name, location, phone, student count,
  teacher count, status
- Only returns active medresas to non-super-admin
- Returns all (including inactive) to super_admin

Feature 2: Create Medresa (Super Admin only)
- POST /api/v1/medresas
- Required: name (unique network-wide), location
- Optional: phone (validate Ethiopian format if provided)
- Zod schema validates all fields

Feature 3: Edit Medresa (Super Admin only)
- PATCH /api/v1/medresas/:id
- Same fields as create
- Name uniqueness re-validated on update

Feature 4: Medresa Detail (Super Admin only)
- GET /api/v1/medresas/:id
- Returns: info + assigned teachers list + student count
  + active course count + status

Feature 5: Deactivate / Reactivate Medresa (Super Admin only)
- PATCH /api/v1/medresas/:id/deactivate
- PATCH /api/v1/medresas/:id/reactivate
- Deactivation: status → INACTIVE
- Medresa admins and teachers of that medresa lose access
- All data fully preserved
- Frontend: confirmation dialog required before deactivation

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin can create/edit/deactivate medresas
BR-02: Medresa name must be unique across the network
BR-03: Deactivating a medresa does NOT delete any data
BR-04: Deactivated medresas hidden from all non-super-admin
BR-05: Medresa must exist before teachers/students assigned
BR-06: Phone optional but validated if provided
BR-07: Fee structure is global — not stored here

TESTS REQUIRED:
- Create medresa with unique name → 201
- Create medresa with duplicate name → 409
- Create medresa without required fields → 422
- Edit medresa name to existing name → 409
- Deactivate medresa → 200, status = INACTIVE
- Deactivated medresa hidden from medresa_admin → 404
- Non-super-admin creating medresa → 403
- Medresa detail returns correct counts → 200

Report after each feature is complete.
```

---

## M03 — Teacher Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M03 — Teacher Management
YOUR FOLDERS:
  backend/src/modules/teachers/
  frontend/src/features/teachers/
  docs/03-teacher.md

DEPENDENCY CHECK: Confirm M01 and M02 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Teacher List (Super Admin only)
- GET /api/v1/teachers
- Paginated, filterable by medresa/status/specialization
- Columns: photo, full name, phone, email,
  specialization, date joined, assigned medresas, status
- Specialization field is JSONB — display in active language

Feature 2: Create Teacher (Super Admin only)
- POST /api/v1/teachers
- Fields: full name, phone, email, specialization (JSON),
  date joined, photo (optional)
- On create: auto-create linked User account (M01)
- Send password reset email to teacher immediately
- Photo: validate MIME server-side, rename with UUID,
  store in /uploads/teachers/ (outside public dir)
- HIGH-ALERT: file upload security

Feature 3: Edit Teacher (Super Admin only)
- PATCH /api/v1/teachers/:id
- Same fields as create
- Photo replacement: delete old file, store new one

Feature 4: Teacher Detail (Super Admin only)
- GET /api/v1/teachers/:id
- Returns: full profile + medresa assignment table
  (medresa name, role, assigned_since)

Feature 5: Assign Teacher to Medresa — Single (Super Admin only)
- POST /api/v1/teachers/:id/medresas
- Body: { medresaId, role: 'teacher'|'admin', assignedSince }
- Creates TeacherMedresa record
- Teacher can be assigned to multiple medresas
- Teacher can be admin in multiple medresas simultaneously

Feature 6: Assign Teacher to Medresa — Bulk (Super Admin only)
- POST /api/v1/teachers/:id/medresas/bulk
- Body: [{ medresaId, role, assignedSince }, ...]
- Creates multiple TeacherMedresa records in one transaction

Feature 7: Change Teacher Role in Medresa (Super Admin only)
- PATCH /api/v1/teachers/:id/medresas/:medresaId
- Body: { role: 'teacher'|'admin' }
- Updates role in TeacherMedresa record

Feature 8: Remove Teacher from Medresa (Super Admin only)
- DELETE /api/v1/teachers/:id/medresas/:medresaId
- Soft delete: sets deleted_at on TeacherMedresa record
- ALL historical data in that medresa preserved
- HIGH-ALERT: data safety zone

Feature 9: Deactivate / Reactivate Teacher (Super Admin only)
- PATCH /api/v1/teachers/:id/deactivate
- PATCH /api/v1/teachers/:id/reactivate
- Deactivation revokes access to ALL medresas immediately
- Linked User account status → INACTIVE

Feature 10: Teacher Own Profile (Teacher — read only)
- GET /api/v1/teachers/me
- Returns: own profile + list of medresas + role in each
- NO editing allowed

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin manages teachers
BR-02: Creating teacher auto-creates User account
BR-03: Teacher assignable to unlimited medresas
BR-04: Admin role possible in multiple medresas simultaneously
BR-05: Role is scoped per medresa (TeacherMedresa)
BR-06: Removing from medresa preserves historical data
BR-07: Deactivation revokes ALL medresa access
BR-08: Teacher must be in medresa before course assignment
BR-09: Photo optional, jpg/png, max 2MB

TESTS REQUIRED:
- Create teacher → 201 + User account created + email sent
- Create teacher with duplicate phone → 409
- Upload invalid file type → 400
- Upload file > 2MB → 400
- Assign teacher to medresa → 201 TeacherMedresa created
- Assign same teacher to multiple medresas → all succeed
- Assign teacher as admin in 2 medresas simultaneously → succeeds
- Remove from medresa → soft deleted, history preserved
- Teacher accessing another teacher's profile → 403
- Teacher accessing own profile → 200
- Non-super-admin creating teacher → 403

Report after each feature is complete.
```

---

## M04 — Course Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M04 — Course Management
YOUR FOLDERS:
  backend/src/modules/courses/
  frontend/src/features/courses/
  docs/04-course.md

DEPENDENCY CHECK: Confirm M01, M02, M03 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Master Course List (Super Admin only)
- GET /api/v1/courses
- Columns: name, description, level, used-by count, status
- Filterable by level and status
- Name/description are JSONB — display in active language

Feature 2: Create / Edit Master Course (Super Admin only)
- POST /api/v1/courses — create
- PATCH /api/v1/courses/:id — edit
- Fields: name (JSON), description (JSON), level
- Name must be unique network-wide

Feature 3: Deactivate Master Course (Super Admin only)
- PATCH /api/v1/courses/:id/deactivate
- Hides from all medresas but preserves all historical data

Feature 4: Medresa Course List (Medresa Admin)
- GET /api/v1/medresas/:medresaId/courses
- Lists all courses activated for this medresa
- Medresa Admin can only access their own medresa
- Columns: course name, level, assigned teacher, student count

Feature 5: Activate Course in Medresa (Medresa Admin)
- POST /api/v1/medresas/:medresaId/courses
- Body: { courseId }
- Creates MedresaCourse record
- Medresa Admin can only activate for their own medresa

Feature 6: Deactivate Course in Medresa (Medresa Admin)
- PATCH /api/v1/medresas/:medresaId/courses/:medresaCourseId/deactivate
- Affects only this medresa — other medresas unaffected
- Historical data preserved

Feature 7: Assign Teacher to Course (Medresa Admin)
- POST /api/v1/medresas/:medresaId/courses/:medresaCourseId/teacher
- Body: { teacherId }
- Teacher must already be assigned to this medresa (M03)
- One teacher per course per medresa
- Creates CourseAssignment record

Feature 8: Course Detail (Medresa Admin + Teacher)
- GET /api/v1/medresas/:medresaId/courses/:medresaCourseId
- Returns: course info + assigned teacher + enrolled students

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin manages master course list
BR-02: Course name unique network-wide
BR-03: Medresa Admin manages only their own medresa
BR-04: Course must be activated before teacher/student assignment
BR-05: One teacher per course per medresa
BR-06: Teacher must be in medresa before course assignment
BR-07: Deactivating master course preserves all history
BR-08: Medresa deactivation affects only that medresa

TESTS REQUIRED:
- Create course with unique name → 201
- Create course with duplicate name → 409
- Medresa Admin activating course → 201 MedresaCourse created
- Medresa Admin accessing other medresa's courses → 403
- Assign teacher not in medresa → 400
- Assign teacher in medresa → 201 CourseAssignment created
- Deactivate master course → hidden from medresa views
- Deactivate course in medresa → only affects that medresa

Report after each feature is complete.
```

---

## M05 — Student Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M05 — Student Management
YOUR FOLDERS:
  backend/src/modules/students/
  frontend/src/features/students/
  docs/05-student.md

DEPENDENCY CHECK: Confirm M01–M04 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Student List (Medresa Admin)
- GET /api/v1/medresas/:medresaId/students
- Medresa Admin sees only their own medresa's students
- Paginated, filterable by gender/course/status
- Columns: photo, name, gender, guardian phone,
  enrolled courses, status

Feature 2: Enroll Student (Medresa Admin)
- POST /api/v1/medresas/:medresaId/students
- Fields: full name, DOB, gender, address,
  guardian name, guardian phone, photo (optional)
- Auto-record enrollment date
- Photo: validate MIME server-side, UUID rename
- Guardian phone: validate Ethiopian format

Feature 3: Edit Student (Medresa Admin)
- PATCH /api/v1/students/:id
- Same fields as enroll
- Only Medresa Admin of student's current medresa can edit

Feature 4: Student Detail (Medresa Admin + Teacher read-only)
- GET /api/v1/students/:id
- Medresa Admin: full profile + courses + transfer history
- Teacher: own course students only, read-only
- Placeholders for attendance/grades/fees (from M06–M08)

Feature 5: Assign Student to Course (Medresa Admin)
- POST /api/v1/students/:id/courses
- Body: { medresaCourseId }
- Course must be active and have assigned teacher
- Creates StudentCourse record
- HIGH-ALERT: validate medresa scope

Feature 6: Remove Student from Course (Medresa Admin)
- DELETE /api/v1/students/:id/courses/:studentCourseId
- Soft delete: sets deleted_at on StudentCourse
- Historical data preserved

Feature 7: Transfer Student (Medresa Admin)
- POST /api/v1/students/:id/transfer
- Body: { toMedresaId, transferDate, reason (optional) }
- Student status in current medresa → TRANSFERRED
- Student current_medresa_id updated
- StudentTransfer record created (full history)
- Destination admin must re-assign courses manually
- HIGH-ALERT: multi-table transaction required

Feature 8: Student List for Teacher (read only)
- GET /api/v1/teacher/students
- Returns only students in teacher's assigned courses
- Teacher sees no other students

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Medresa Admin can enroll/edit/transfer students
BR-02: Student belongs to exactly one medresa at a time
BR-03: Transfer preserves all historical data
BR-04: After transfer, destination admin re-assigns courses
BR-05: Student only assignable to courses with active teacher
BR-06: Teachers see only their course students
BR-07: Super Admin read-only view of all students
BR-08: Photo optional, max 2MB, jpg/png
BR-09: Guardian phone valid Ethiopian format
BR-10: Enrollment date auto-recorded

TESTS REQUIRED:
- Enroll student → 201, enrolled_at set automatically
- Upload invalid photo type → 400
- Assign student to course without teacher → 400
- Assign student to course in wrong medresa → 403
- Transfer student → StudentTransfer created, status updated
- Teacher accessing student not in their course → 403
- Medresa Admin accessing another medresa's students → 403
- Remove from course → soft deleted, history preserved

Report after each feature is complete.
```

---

## M06 — Attendance Tracking

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M06 — Attendance Tracking
YOUR FOLDERS:
  backend/src/modules/attendance/
  frontend/src/features/attendance/
  docs/06-attendance.md

DEPENDENCY CHECK: Confirm M01–M05 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Take Attendance (Teacher)
- POST /api/v1/attendance/sessions
- Body: { medresaCourseId, date, records: [{studentId, status, note}] }
- Creates AttendanceSession + AttendanceRecord per student
- Default status: ABSENT for any student not included
- Cannot take attendance for future dates
- Cannot take attendance for courses not assigned to this teacher
- Cannot duplicate session for same course + date

Feature 2: Edit Attendance (Teacher — same day only)
- PATCH /api/v1/attendance/sessions/:sessionId
- Only allowed if session date = today AND is_locked = false
- Updates individual AttendanceRecord statuses
- Sets edited_at timestamp on changed records
- Returns 403 if session is locked

Feature 3: Midnight Lock Cron Job
- Runs daily at 00:00:00 Africa/Addis_Ababa (UTC+3)
- Finds all AttendanceSession where date = yesterday AND is_locked = false
- Sets is_locked = true on all found sessions
- HIGH-ALERT: timezone handling — use Ethiopia timezone explicitly

Feature 4: Attendance History (Teacher)
- GET /api/v1/attendance/sessions
- Filtered by teacher's courses
- Filterable by date range
- Read only — no editing of past sessions

Feature 5: Student Attendance Detail (Teacher)
- GET /api/v1/attendance/students/:studentId
- Only for students in teacher's courses
- Returns full attendance history for one student
- Includes: date, status, note per session
- Summary: total present/absent/late/excused + percentage

Feature 6: Medresa Attendance Overview (Medresa Admin)
- GET /api/v1/medresas/:medresaId/attendance/overview
- Daily summary across all courses in their medresa
- Columns: course, teacher, present, absent, late, excused, total
- Filterable by date/course/teacher
- Read only

Feature 7: Network Attendance Overview (Super Admin)
- GET /api/v1/attendance/network-overview
- Network-wide daily summary by medresa
- Filterable by medresa and date range
- Read only

BUSINESS RULES TO IMPLEMENT:
BR-01: Only teachers can record and edit attendance
BR-02: Attendance recorded once per day per student
BR-03: Default status is ABSENT
BR-04: Teacher can only edit attendance on same calendar day
BR-05: After midnight, attendance permanently locked (cron)
BR-06: Edit timestamp logged on corrections
BR-07: Teacher can only take attendance for assigned courses
BR-08: No future date attendance
BR-09: Medresa Admin and Super Admin view only

TIMEZONE NOTE — HIGH-ALERT:
Ethiopia is UTC+3 (Africa/Addis_Ababa).
"Today" and "midnight" must always be calculated in
Ethiopia timezone, not server timezone.
Use the date-fns-tz library or equivalent.

TESTS REQUIRED:
- Submit attendance for valid course → 201
- Submit attendance for course not assigned to teacher → 403
- Submit attendance for future date → 400
- Submit duplicate session (same course + date) → 409
- Edit attendance same day → 200, edited_at set
- Edit attendance after midnight (locked) → 403
- Teacher viewing another teacher's attendance → 403
- Medresa Admin viewing their medresa overview → 200
- Midnight cron: sessions from yesterday locked → verified

Report after each feature is complete.
```

---

## M07 — Grades & Results

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M07 — Grades & Results
YOUR FOLDERS:
  backend/src/modules/grades/
  frontend/src/features/grades/
  docs/07-grades.md

DEPENDENCY CHECK: Confirm M01–M05 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Exam Type Management (Super Admin only)
- GET/POST/PATCH /api/v1/exam-types
- Fields: name (JSON), max_score, weight (%)
- Validation: all active exam type weights must sum to 100%
- Check sum before create and on every edit

Feature 2: Grade Entry (Teacher)
- POST /api/v1/grades
- Body: { studentId, medresaCourseId, examTypeId, numericScore }
- Teacher can only grade students in their assigned courses
- Auto-calculate letter grade:
  90–100→A, 80–89→B, 70–79→C, 60–69→D, 0–59→F
- Numeric score cannot exceed exam type max_score
- One grade per student per course per exam type (unique constraint)

Feature 3: Grade Edit Request (Teacher)
- POST /api/v1/grades/:gradeId/edit-requests
- Body: { requestedScore, reason }
- Creates GradeEditRequest with status: PENDING
- Grade unchanged until approved
- Teacher cannot submit duplicate pending request for same grade

Feature 4: Grade Edit Approval (Medresa Admin + Super Admin)
- GET /api/v1/grade-edit-requests — list pending requests
- PATCH /api/v1/grade-edit-requests/:id/approve
- PATCH /api/v1/grade-edit-requests/:id/reject
- On approve: Grade updated, letter grade recalculated
- On reject: Body requires rejection_reason
- All approvals logged in AuditLog
- Teacher notified (in-app notification or flag on their dashboard)
- HIGH-ALERT: financial-adjacent data — extra care

Feature 5: Student Results (Teacher + Medresa Admin)
- GET /api/v1/students/:studentId/results
- Full grade report: course, exam type, score, letter grade,
  weight, weighted total
- Overall GPA calculated across all courses
- Teacher sees only their course students

Feature 6: Class Results (Teacher)
- GET /api/v1/courses/:medresaCourseId/results
- All students' grades in this course
- Columns: student name, scores per exam type, weighted total
- PDF export endpoint: GET /api/v1/courses/:medresaCourseId/results/pdf

Feature 7: Medresa Results Overview (Medresa Admin)
- GET /api/v1/medresas/:medresaId/results/overview
- Grade summary per course: average, highest, lowest

Feature 8: Network Results Overview (Super Admin)
- GET /api/v1/results/network-overview
- Grade summary across all medresas

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin manages exam types
BR-02: Active exam type weights must sum to 100%
BR-03: Letter grade auto-calculated, never manually set
BR-04: Teacher grades only their course students
BR-05: Grade edits require Medresa Admin or Super Admin approval
BR-06: Grade unchanged until approved
BR-07: All edit requests and approvals logged
BR-08: Medresa Admin cannot directly edit grades
BR-09: Super Admin can approve for any medresa
BR-10: No grade for student not enrolled in course

TESTS REQUIRED:
- Create exam types summing to 100% → 201
- Create exam type making total exceed 100% → 400
- Submit grade for valid student/course → 201 + letter grade auto-set
- Submit grade exceeding max_score → 400
- Submit grade for student not in teacher's course → 403
- Submit duplicate grade (same student/course/exam) → 409
- Submit edit request → 201, grade unchanged
- Approve edit request → 200, grade updated, letter recalculated
- Reject without reason → 422
- Medresa Admin accessing other medresa's grades → 403
- PDF export → valid PDF returned

Report after each feature is complete.
```

---

## M08 — Fee Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M08 — Fee Management
YOUR FOLDERS:
  backend/src/modules/fees/
  frontend/src/features/fees/
  docs/08-fees.md

DEPENDENCY CHECK: Confirm M01–M05 are fully complete.

FEATURES TO BUILD (in this order):

Feature 1: Fee Structure Management (Super Admin only)
- GET /api/v1/fee-structure — current active structure
- GET /api/v1/fee-structure/history — all versions
- POST /api/v1/fee-structure — set new amount
- Setting new amount: deactivates current, creates new record
- Amount stored in Ethiopian cents (Int)
- HIGH-ALERT: financial data zone

Feature 2: Fee Collection List (Medresa Admin)
- GET /api/v1/medresas/:medresaId/fees
- All students with current month payment status
- Status: PAID (amount_paid >= amount_due),
  PARTIAL (0 < amount_paid < amount_due),
  UNPAID (amount_paid = 0)
- Filterable by status and month
- Medresa Admin sees only their medresa

Feature 3: Record Fee Payment (Medresa Admin)
- POST /api/v1/medresas/:medresaId/fees/payments
- Body: { studentId, month, year, amountPaid,
          paymentMethod, bankReference, paymentDate, note }
- Bank reference required if paymentMethod = BANK_TRANSFER
- Payment date cannot be future date
- Partial payments allowed
- Multiple payments per student per month allowed
- Updates FeeBalance after each payment
- HIGH-ALERT: financial data, multi-table transaction

Feature 4: Student Fee History (Medresa Admin)
- GET /api/v1/students/:studentId/fees
- Full payment history: month, amount due, amount paid,
  method, reference, date, balance
- Summary: total paid, total outstanding
- PDF export: GET /api/v1/students/:studentId/fees/pdf

Feature 5: Medresa Fee Overview (Medresa Admin)
- GET /api/v1/medresas/:medresaId/fees/overview
- Monthly summary: total students, total due, collected,
  outstanding, collection rate %
- Filterable by month range

Feature 6: Network Fee Overview (Super Admin)
- GET /api/v1/fees/network-overview
- Cross-medresa summary
- Filterable by medresa and month range

BUSINESS RULES TO IMPLEMENT:
BR-01: Only Super Admin sets fee structure
BR-02: Fee changes versioned — history never deleted
BR-03: One flat monthly fee for all students
BR-04: Medresa Admin records payments for their medresa only
BR-05: Partial payments allowed — balance tracked
BR-06: Multiple payments per student per month allowed
BR-07: Bank transfer requires reference number
BR-08: Payment date cannot be future
BR-09: Medresa Admin cannot edit/delete recorded payments
BR-10: Outstanding balance carries forward month to month
BR-11: Teachers have zero access to fee data

FINANCIAL DATA RULES — HIGH-ALERT:
- All amounts stored as Integer (Ethiopian cents)
- 500.00 ETB = 50000 cents
- Never use floats for monetary values
- FeeBalance must be updated atomically with FeePayment
  (use Prisma transaction)
- Always recalculate balance from payments (don't trust cached)

TESTS REQUIRED:
- Set fee structure → 201, old structure deactivated
- Record cash payment → 201, FeeBalance updated
- Record bank transfer without reference → 422
- Record payment with future date → 400
- Record partial payment → status = PARTIAL
- Record full payment → status = PAID
- Multiple payments same student same month → all succeed
- Teacher accessing fee data → 403
- Medresa Admin accessing other medresa fees → 403
- PDF export → valid PDF returned
- Fee balance accuracy verified after multiple payments

Report after each feature is complete.
```

---

## M09 — Salary Management

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M09 — Salary Management
YOUR FOLDERS:
  backend/src/modules/salaries/
  frontend/src/features/salaries/
  docs/09-salary.md

DEPENDENCY CHECK: Confirm M01, M02, M03 are fully complete.

CRITICAL: This module is Super Admin EXCLUSIVE.
Apply the strictest possible role guard to every single
endpoint in this module. Any non-super-admin request
must return 403 immediately — no exceptions.

FEATURES TO BUILD (in this order):

Feature 1: Salary Rank Management (Super Admin only)
- GET /api/v1/salary-ranks — list all ranks
- GET /api/v1/salary-ranks/history — all versions
- POST /api/v1/salary-ranks — create rank
- PATCH /api/v1/salary-ranks/:id — edit rank
- PATCH /api/v1/salary-ranks/:id/deactivate — deactivate
- Rank amount changes: create new version with effective_from
- Amount stored in Ethiopian cents
- HIGH-ALERT: financial data zone

Feature 2: Assign Rank to Teacher (Super Admin only)
- POST /api/v1/teachers/:id/rank
- Body: { salaryRankId, effectiveFrom }
- Creates TeacherRank record (versioned history)
- One active rank per teacher at a time
- Previous rank record kept (history preserved)
- GET /api/v1/teachers/:id/rank-history — view history

Feature 3: Salary Payment List (Super Admin only)
- GET /api/v1/salary-payments
- All active teachers with rank, monthly salary, payment status
- Status: PAID / UNPAID for current month
- System flags unpaid teachers (from cron job)
- Filterable by rank/status/month

Feature 4: Monthly Unpaid Salary Flag Cron Job
- Runs on 1st of every month at 06:00 Africa/Addis_Ababa
- Identifies all active teachers without a SalaryPayment
  for the previous month
- Creates a summary accessible via dashboard
- HIGH-ALERT: timezone handling

Feature 5: Record Salary Payment (Super Admin only)
- POST /api/v1/salary-payments
- Body: { teacherId, month, year, amountPaid,
          bankReference, paymentDate, note,
          isAdjusted, adjustmentReason }
- Bank reference always required
- Amount auto-filled from current rank (but editable)
- If amount differs from rank amount: isAdjusted = true,
  adjustmentReason required
- One payment per teacher per month (unique constraint)
- Payment date cannot be future
- HIGH-ALERT: financial data, log everything

Feature 6: Teacher Salary History (Super Admin only)
- GET /api/v1/teachers/:id/salary-history
- Full payment history: month, rank, amount, reference, date
- Summary: total paid this year, current rank, monthly amount
- PDF export: GET /api/v1/teachers/:id/salary-history/pdf

Feature 7: Network Salary Overview (Super Admin only)
- GET /api/v1/salaries/network-overview
- Monthly summary: total teachers, paid, unpaid, total disbursed
- Filterable by month range and rank
- PDF export: GET /api/v1/salaries/network-overview/pdf

BUSINESS RULES TO IMPLEMENT:
BR-01: Super Admin EXCLUSIVE — 403 for all other roles
BR-02: Salary by network-wide rank (not per medresa)
BR-03: One active rank per teacher at a time
BR-04: Rank changes versioned with effective dates
BR-05: Rank amount changes versioned — history never deleted
BR-06: One salary payment per teacher per month
BR-07: Bank reference mandatory for every payment
BR-08: Payment date cannot be future
BR-09: Adjustments logged with reason
BR-10: System flags unpaid teachers monthly
BR-11: Deactivated teacher history preserved
BR-12: Zero visibility for medresa_admin and teacher roles

FINANCIAL DATA RULES — HIGH-ALERT:
- All amounts as Integer (Ethiopian cents)
- isAdjusted = true whenever amount ≠ rank monthly_amount
- adjustmentReason required when isAdjusted = true
- All salary operations logged in AuditLog

TESTS REQUIRED:
- Any medresa_admin request to any endpoint → 403
- Any teacher request to any endpoint → 403
- Create salary rank → 201
- Assign rank to teacher → 201, TeacherRank created
- Assign new rank → old rank history preserved
- Record payment with bank reference → 201
- Record payment without bank reference → 422
- Record duplicate payment (same teacher/month/year) → 409
- Record payment with future date → 400
- Record adjusted payment without reason → 422
- Monthly cron → unpaid teachers flagged correctly
- PDF export → valid PDF returned

Report after each feature is complete.
```

---

## M10 — Reporting & Dashboard

```
[SEND FOUNDATION PROMPT FIRST]

YOUR MODULE: M10 — Reporting & Dashboard
YOUR FOLDERS:
  backend/src/modules/reports/
  frontend/src/features/reports/
  docs/10-reporting.md

DEPENDENCY CHECK: Confirm ALL modules M01–M09 are fully
complete before starting this module. This module reads
from every other module.

IMPORTANT: This module creates NO new database tables.
It only reads from existing tables. Do not modify the
Prisma schema.

FEATURES TO BUILD (in this order):

Feature 1: Ethiopian Date Utility
- Create: src/lib/ethiopian-date.ts
- Functions:
  toEthiopian(date: Date): EthiopianDate
  toGregorian(eth: EthiopianDate): Date
  getCurrentEthiopianYear(): number
  getCurrentEthiopianMonth(): number
  formatEthiopian(date: Date, format: string): string
- Use ethiopian-date npm package
- All dashboard dates must go through this utility
- All report filters must accept Ethiopian dates

Feature 2: Teacher Dashboard
- GET /api/v1/dashboard/teacher
- Returns:
  - Total students in teacher's courses
  - Today's attendance rate (%) across teacher's courses
  - Count of pending grade entries (students with no grade
    for active exam types)
  - Attendance trend: last 30 days (daily % present)
  - Grade distribution per course (count per letter grade)
- All dates in Ethiopian calendar

Feature 3: Medresa Admin Dashboard
- GET /api/v1/dashboard/medresa
- Returns:
  - Total enrolled students
  - Total active courses
  - Today's attendance rate across all medresa courses
  - Total fees collected this Ethiopian month (ETB)
  - Total outstanding fees (ETB)
  - Monthly fee collection vs outstanding (last 6 months)
  - Student enrollment trend (last 12 months)
  - Attendance rate per course
  - Grade average per course
- All monetary values converted from cents to ETB for display

Feature 4: Super Admin Dashboard
- GET /api/v1/dashboard/super-admin
- Returns:
  - Total active/inactive medresas
  - Total teachers in network
  - Total students across network
  - Total fees collected this Ethiopian month
  - Total outstanding fees network-wide
  - Total salary disbursed this Ethiopian month
  - Count of unpaid teachers this month
  - Enrollment per medresa (bar chart data)
  - Monthly fee collection trend (line chart data)
  - Monthly salary disbursement trend (line chart data)
  - Attendance rate per medresa
  - Grade average per medresa

Feature 5: Report — Student Enrollment (R01)
- GET /api/v1/reports/enrollment
- Filters: medresaId (admin/super), dateRange (Ethiopian)
- Content: student list, enrollment date, courses,
  transfer history, status
- PDF: GET /api/v1/reports/enrollment/pdf
- Excel: GET /api/v1/reports/enrollment/excel

Feature 6: Report — Attendance (R02)
- GET /api/v1/reports/attendance
- Filters: course, student, dateRange (Ethiopian calendar)
- Content: daily records, summary per student, % per student
- PDF and Excel exports

Feature 7: Report — Fee Collection (R03)
- GET /api/v1/reports/fees
- Filters: medresaId, month, status (paid/partial/unpaid)
- Content: payments per student per month, outstanding balances,
  collection rate %
- PDF and Excel exports

Feature 8: Report — Salary (R04) — Super Admin only
- GET /api/v1/reports/salary
- Filters: rank, month range, payment status
- Content: salary payments per teacher, rank, amount,
  bank reference, unpaid list
- PDF and Excel exports
- HIGH-ALERT: Super Admin only — strictest role guard

Feature 9: Report — Grades & Results (R05)
- GET /api/v1/reports/grades
- Filters: course, exam type, student, Ethiopian academic year
- Content: grades per exam type per course, weighted totals,
  letter grades, class averages
- PDF and Excel exports

BUSINESS RULES TO IMPLEMENT:
BR-01: All dates displayed in Ethiopian calendar
BR-02: Dates stored Gregorian, converted for display
BR-03: Teachers export only their own course reports
BR-04: Medresa Admins export only their medresa reports
BR-05: Super Admin exports any report network-wide
BR-06: Salary reports Super Admin only
BR-07: All exports timestamped in Ethiopian calendar
BR-08: Charts use live data (no stale caches on dashboard)

PERFORMANCE NOTE:
Dashboard aggregates can be expensive queries. Use:
- Prisma aggregations (count, sum, avg) not raw loops
- Materialized views for heavy historical aggregates
- TanStack Query appropriate stale times on frontend

TESTS REQUIRED:
- Teacher dashboard returns only their data
- Medresa Admin dashboard returns only their medresa data
- Super Admin dashboard returns network-wide data
- Teacher exporting another teacher's report → 403
- Medresa Admin exporting salary report → 403
- R04 salary report by non-super-admin → 403
- PDF export → valid PDF with Ethiopian dates
- Excel export → valid xlsx file
- Ethiopian date utility: known date conversion verified
- Dashboard monetary values displayed as ETB (not cents)

Report after each feature is complete.
```

---

## QUICK REFERENCE: Module Ownership Table

| Module | Agent Folder (Backend) | Agent Folder (Frontend) | Owner Role |
|--------|----------------------|------------------------|------------|
| M01 | `modules/auth/` | `features/auth/` | Super Admin |
| M02 | `modules/medresas/` | `features/medresas/` | Super Admin |
| M03 | `modules/teachers/` | `features/teachers/` | Super Admin |
| M04 | `modules/courses/` | `features/courses/` | Super Admin + Medresa Admin |
| M05 | `modules/students/` | `features/students/` | Medresa Admin |
| M06 | `modules/attendance/` | `features/attendance/` | Teacher |
| M07 | `modules/grades/` | `features/grades/` | Teacher |
| M08 | `modules/fees/` | `features/fees/` | Medresa Admin |
| M09 | `modules/salaries/` | `features/salaries/` | Super Admin ONLY |
| M10 | `modules/reports/` | `features/reports/` | All (role-scoped) |

---

## QUICK REFERENCE: High-Alert Trigger Map

| Zone | Triggered in Modules |
|------|---------------------|
| ⚠️ Security & Auth | M01 (entire module), M02–M10 (all auth checks) |
| ⚠️ Cross-Module Boundary | M04 (needs M03 teacher check), M05 (needs M04 course check), M10 (reads all) |
| 🚫 Hard Delete (NEVER) | Every module — every DELETE operation everywhere |
| ⚠️ Financial Data | M08 (fees), M09 (salary), M10 (financial reports) |
| ⚠️ Testing | Every module — every feature |
| ⚠️ Documentation | Every module — every feature |

---

*Sefinet Al Neja Agent Prompt Cards v1.0*
*Use alongside Sefinet-Agent-Rules.md and Sefinet-Master-Project-Spec.md*
*When in doubt: stop, document, ask.*
