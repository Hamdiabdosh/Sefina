━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 1: Vision & Problem Statement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a senior software architect. I am building a web-based
management system called the Harari Medresa Management System (HMMS)
for a network of 20+ Islamic schools (medresas) in Harari, Ethiopia.

PROBLEM:
- Student records are scattered and lost across schools
- Fee collection is informal and untracked
- Teacher salaries are uncoordinated
- No one has a network-wide view of all medresas

SOLUTION:
A multi-tenant platform with two access tiers:
- Medresa Admin: manages their own school only
- Super Admin: oversees all 20+ medresas from one dashboard

LANGUAGE SUPPORT: Amharic, English, Arabic (RTL support needed for Arabic)

CORE MODULES NEEDED:
1. Student Management
2. Teacher Management
3. Fee Management
4. Salary Management
5. Reporting & Dashboard

Your task: Validate this vision and identify any architectural risks
or missing features I should consider before building. Be specific
to the Islamic school context in Ethiopia.

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 2: Master System Context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a senior software architect helping me build the
Harari Medresa Management System (HMMS) — a multi-tenant
web platform managing 20+ Islamic schools in Harari, Ethiopia.

ACTOR MODEL (3 tiers):

1. SUPER ADMIN
   - One global account, full network access
   - Owns: salary management, fee structure setup,
     medresa creation, teacher account creation,
     admin assignments, network-wide reporting

2. MEDRESA ADMIN (teacher elevated per medresa)
   - Manages one medresa (can still teach in others)
   - Owns: student enrollment, teacher assignment,
     fee payment tracking, medresa reports
   - No access to salary data

3. TEACHER (network-level entity)
   - Can be assigned to multiple medresas simultaneously
   - Role (teacher vs admin) is scoped per medresa
   - Owns: attendance recording, grade entry,
     own profile view, class/student view

CRITICAL DESIGN RULES:
- Teachers are network-level, not medresa-owned
- A teacher's role is stored per medresa (join table)
- Salary module is Super Admin exclusive
- Multi-language: Amharic, English, Arabic (RTL required)
- Data isolation: each medresa sees only its own data

Use this as the master context for all future build prompts.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 3: Module Context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building the Harari Medresa Management System (HMMS),
a multi-tenant platform for 20+ Islamic schools in Harari, Ethiopia.

The system has 10 modules built in this order:

TIER 1 — FOUNDATION
  M01. User & Role Management (Super Admin)
  M02. Medresa Management (Super Admin)
  M03. Teacher Management (Super Admin)

TIER 2 — CORE
  M04. Course Management (Super Admin creates, Medresa Admin assigns)
  M05. Student Management (Medresa Admin)

TIER 3 — OPERATIONAL
  M06. Attendance Tracking (Teacher)
  M07. Grades & Results (Teacher)
  M08. Fee Management (Medresa Admin)
  M09. Salary Management (Super Admin ONLY)

TIER 4 — INSIGHTS
  M10. Reporting & Dashboard (role-scoped)

CRITICAL RULES:
- Teachers are network-level entities, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- A teacher can be admin in one medresa, regular teacher in another
- All modules must enforce strict data isolation per medresa
- Language support: Amharic, English, Arabic (RTL)

When I say "build M0X", use this as your full system context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M01: User & Role Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M01: User & Role Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated per medresa),
  Teacher (network-level entity)
- Teachers can belong to multiple medresas simultaneously
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. LOGIN: phone or email + password. On success, redirect by role.
2. FORGOT PASSWORD: email-based reset link, expires in 1 hour.
3. USER MANAGEMENT (Super Admin only):
   - List all users with filters (medresa, role, status)
   - Create user (full name, phone, email, auto-generated password)
   - Edit user details
   - Deactivate / reactivate user (preserves all historical data)

BUSINESS RULES TO ENFORCE:
- Only Super Admin can create/edit/deactivate accounts
- Deactivated accounts lose access immediately
- Historical records of deactivated teachers are never deleted
- Super Admin account cannot be deactivated
- Reset links expire after 1 hour
- No user enumeration on forgot password screen

DATA MODELS:
  User { id, full_name, phone, email, password_hash,
         status, is_super_admin, created_at, updated_at }
  PasswordResetToken { id, user_id, token_hash,
                       expires_at, used, created_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above (login, forgot password,
  reset password, user list, create/edit user, deactivate dialog)
- API endpoints for auth and user CRUD
- Middleware for role-based access control
- Do NOT build other modules — stop at M01 boundaries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M02: Medresa Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M02: Medresa Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. MEDRESA LIST: paginated list of all medresas with
   name, location, phone, student count, teacher count,
   status. Filterable by status and location.

2. CREATE / EDIT MEDRESA (Super Admin only):
   - Required: name (unique), location
   - Optional: phone number (validated if provided)

3. MEDRESA DETAIL: full profile view with assigned
   teachers, student count, course count, status.

4. DEACTIVATE / REACTIVATE (Super Admin only):
   - Confirmation dialog before action
   - Deactivation hides medresa from all non-super-admin views
   - All data fully preserved, reactivatable anytime

BUSINESS RULES TO ENFORCE:
- Only Super Admin can create/edit/deactivate medresas
- Medresa name must be unique network-wide
- Deactivation never deletes data
- Deactivated medresas hidden from Medresa Admin & Teacher views
- Fee structure is global (not stored here — belongs to M08)

DATA MODEL:
  Medresa { id, name, location, phone (nullable),
            status, created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: list, create, edit, deactivate, reactivate,
  get detail
- Do NOT build teacher/student assignment here —
  that belongs to M03 and M05
- Do NOT build fee structure here — that belongs to M08



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M03: Teacher Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M03: Teacher Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level — not owned by any single medresa
- A teacher's role (admin/teacher) is fully flexible per medresa
- A teacher can be admin in any number of medresas simultaneously
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. TEACHER LIST (Super Admin only):
   - All network teachers with photo, name, phone, email,
     specialization, date joined, assigned medresas, status
   - Filters: by medresa, status, specialization

2. CREATE / EDIT TEACHER (Super Admin only):
   - Fields: full name, phone, email, specialization,
     date joined, photo (optional, max 2MB)
   - On create: auto-generate linked User account (M01)
     and send password reset email

3. TEACHER DETAIL (Super Admin only):
   - Full profile + medresa assignment table
     (medresa name, role, assigned since)
   - Actions: edit, assign to medresa, change role,
     remove from medresa

4. ASSIGN TO MEDRESA (Super Admin only):
   - Single: select one medresa + role
   - Bulk: select multiple medresas, set role per medresa

5. TEACHER OWN PROFILE (Teacher — read only):
   - Own info + list of assigned medresas with role in each

BUSINESS RULES TO ENFORCE:
- Only Super Admin manages teachers
- Creating teacher auto-creates User account
- Role is stored per medresa (TeacherMedresa join table)
- A teacher can hold admin role in multiple medresas
- Removing from medresa preserves all historical data
- Deactivation revokes access to all medresas immediately

DATA MODELS:
  Teacher { id, user_id, full_name, phone, email,
            specialization, date_joined, photo_url,
            status, created_at, updated_at }
  TeacherMedresa { id, teacher_id, medresa_id,
                   role (teacher/admin), assigned_since,
                   created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: list teachers, create, edit, get detail,
  assign to medresa (single & bulk), change role,
  remove from medresa, deactivate/reactivate
- Photo upload handling (max 2MB, jpg/png only)
- Do NOT build course assignment here — that belongs to M04
- Do NOT build salary here — that belongs to M09


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M04: Course Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M04: Course Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students, fees & course activation only
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. MASTER COURSE LIST (Super Admin only):
   - Create/edit/deactivate courses (name, description, level)
   - Course name unique network-wide
   - View how many medresas activated each course

2. MEDRESA COURSE LIST (Medresa Admin):
   - View all activated courses for their medresa
   - Activate courses from master list
   - Deactivate courses within their medresa only

3. ASSIGN TEACHER TO COURSE (Medresa Admin):
   - Assign one teacher per course per medresa
   - Teacher must already be assigned to that medresa (M03)
   - A teacher can be assigned to multiple courses
     in the same medresa
   - A teacher can teach the same/different courses
     across different medresas

4. COURSE DETAIL (Medresa Admin & Teacher):
   - Course info, assigned teacher, enrolled students,
     attendance & grade summaries (placeholders for M06/M07)

BUSINESS RULES TO ENFORCE:
- Only Super Admin manages master course list
- Course must be activated in a medresa before use
- One teacher per course per medresa
- Deactivating master course preserves all historical data
- Medresa course deactivation affects only that medresa

DATA MODELS:
  Course { id, name, description, level, status,
           created_at, updated_at }
  MedresaCourse { id, medresa_id, course_id, status,
                  activated_at, created_at, updated_at }
  CourseAssignment { id, medresa_course_id, teacher_id,
                     assigned_since, created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: list master courses, create/edit/deactivate
  course, activate/deactivate course per medresa,
  assign teacher to course, get course detail
- Do NOT build student enrollment here — that belongs to M05
- Do NOT build attendance or grades here — M06 and M07


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M05: Student Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M05: Student Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. STUDENT LIST (Medresa Admin):
   - All students in their medresa with photo, name,
     gender, guardian phone, enrolled courses, status
   - Filters: by gender, course, status

2. ENROLL / EDIT STUDENT (Medresa Admin):
   - Fields: full name, DOB, gender, address,
     guardian name & phone, photo (optional, max 2MB)
   - Auto-record enrollment date on creation

3. STUDENT DETAIL (Medresa Admin & Teacher):
   - Full profile + current medresa + enrolled courses
   - Transfer history (previous medresas)
   - Placeholders for attendance, grades, fee status

4. ASSIGN TO COURSE (Medresa Admin):
   - Assign student to one or more active courses
     that have an assigned teacher in their medresa

5. TRANSFER STUDENT (Medresa Admin):
   - Select destination medresa + transfer date + reason
   - Status in current medresa → Transferred
   - All historical data preserved in previous medresa
   - Destination admin must re-assign courses manually
   - Transfer history fully recorded

6. STUDENT LIST (Teacher — read only):
   - Only students in their assigned courses
   - View detail only, no editing

BUSINESS RULES TO ENFORCE:
- Student belongs to exactly one medresa at a time
- Transfer preserves all historical data
- Student can only be assigned to courses with
  an active teacher assignment
- Teachers see only their own course students
- Super Admin has read-only view of all students

DATA MODELS:
  Student { id, full_name, date_of_birth, gender,
            address, guardian_name, guardian_phone,
            photo_url, current_medresa_id, status,
            enrolled_at, created_at, updated_at }
  StudentCourse { id, student_id, medresa_course_id,
                  enrolled_at, created_at, updated_at }
  StudentTransfer { id, student_id, from_medresa_id,
                    to_medresa_id, transfer_date,
                    reason, created_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: list students, enroll, edit, get detail,
  assign to course, remove from course, transfer student,
  get transfer history
- Photo upload handling (max 2MB, jpg/png only)
- Do NOT build attendance here — that belongs to M06
- Do NOT build grades here — that belongs to M07
- Do NOT build fee tracking here — that belongs to M08

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M06: Attendance Tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M06: Attendance Tracking for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. ATTENDANCE TAKING (Teacher):
   - List all students in their course for today
   - Default all students to Absent
   - Mark each student: Present/Absent/Late/Excused
   - Optional note per student
   - Submit locks the record for the day

2. EDIT ATTENDANCE (Teacher — same day only):
   - Allow corrections until midnight
   - Log edit timestamp on any change
   - After midnight: permanently locked

3. ATTENDANCE HISTORY (Teacher):
   - Past records per course, filterable by date & student
   - Read only after lock

4. STUDENT ATTENDANCE DETAIL (Teacher):
   - Full history for one student in their course
   - Summary counts + attendance percentage

5. MEDRESA ATTENDANCE OVERVIEW (Medresa Admin):
   - Daily summary across all courses in their medresa
   - Drill down into course attendance detail
   - Filters: by date, course, teacher

6. NETWORK ATTENDANCE OVERVIEW (Super Admin):
   - Network-wide daily summary by medresa
   - Filters: by medresa, date range

BUSINESS RULES TO ENFORCE:
- Attendance taken once per day per student (not per session)
- Default status is Absent
- Same-day edits only — locked after midnight
- Edit timestamp logged on corrections
- Teachers see only their own course students
- Medresa Admin & Super Admin view only — no editing
- No future date attendance allowed

DATA MODELS:
  AttendanceSession { id, medresa_course_id, teacher_id,
                      date, submitted_at, is_locked,
                      created_at, updated_at }
  AttendanceRecord { id, session_id, student_id,
                     status (present/absent/late/excused),
                     note, edited_at, created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: take attendance, edit attendance,
  get session by date, get student attendance history,
  get medresa overview, get network overview
- Midnight lock logic (scheduled job or on-read check)
- Do NOT build grades here — that belongs to M07

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M07: Grades & Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M07: Grades & Results for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. EXAM TYPE MANAGEMENT (Super Admin only):
   - Create/edit/deactivate exam types (name, max score, weight)
   - Active exam type weights must sum to 100%
   - Examples: Midterm, Final, Assignment, Quiz, Hifz Test

2. GRADE ENTRY (Teacher):
   - Select exam type → enter numeric score per student
   - Auto-calculate letter grade:
     90-100→A, 80-89→B, 70-79→C, 60-69→D, below 60→F
   - Submit grades for whole class at once

3. GRADE EDIT REQUEST (Teacher):
   - Request score change with reason
   - Grade unchanged until approved
   - Request sent to Medresa Admin for approval

4. GRADE EDIT APPROVAL (Medresa Admin & Super Admin):
   - View pending requests: teacher, student, course,
     current vs requested score, reason
   - Approve or reject with reason
   - Teacher notified of outcome

5. STUDENT RESULTS (Teacher & Medresa Admin):
   - Full grade report per student: course, exam type,
     score, letter grade, weight, weighted total, GPA

6. CLASS RESULTS (Teacher):
   - All students' grades per course
   - Export to PDF

7. MEDRESA RESULTS OVERVIEW (Medresa Admin):
   - Grade summary per course: average, highest, lowest

8. NETWORK RESULTS OVERVIEW (Super Admin):
   - Grade summary across all medresas

BUSINESS RULES TO ENFORCE:
- Only Super Admin manages exam types
- Exam type weights must sum to 100%
- Letter grade auto-calculated, not manually entered
- Grade edits require Medresa Admin or Super Admin approval
- Grade unchanged until approved
- All edit requests and approvals logged
- Teacher sees only their own course students

DATA MODELS:
  ExamType { id, name, max_score, weight,
             status, created_at, updated_at }
  Grade { id, student_id, medresa_course_id,
          exam_type_id, teacher_id, numeric_score,
          letter_grade, submitted_at,
          created_at, updated_at }
  GradeEditRequest { id, grade_id, requested_by,
                     current_score, requested_score,
                     reason, status, reviewed_by,
                     reviewed_at, rejection_reason,
                     created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: manage exam types, submit grades,
  request grade edit, approve/reject edit,
  get student results, get class results,
  get medresa overview, get network overview
- PDF export for class results
- Do NOT build fee tracking here — that belongs to M08
- Do NOT build salary here — that belongs to M09


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M08: Fee Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M08: Fee Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin (teacher elevated
  per medresa), Teacher (network-level entity)
- Teachers are network-level, assigned to medresas by Super Admin
- Medresa Admins manage students & fees only — NOT teachers
- Salary is Super Admin exclusive
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. FEE STRUCTURE (Super Admin only):
   - Set one flat monthly fee amount (ETB) network-wide
   - Fee changes versioned with effective dates
   - Full fee history preserved

2. FEE COLLECTION (Medresa Admin):
   - View all students with current month payment status
     (Paid / Partial / Unpaid)
   - Filters: by status, by month

3. RECORD PAYMENT (Medresa Admin):
   - Fields: student, month/year, amount paid,
     payment method (cash/bank transfer),
     bank reference (required if bank transfer),
     payment date, optional note
   - Partial payments allowed, balance tracked
   - Multiple payments per student per month allowed

4. STUDENT FEE HISTORY (Medresa Admin):
   - Full payment history per student
   - Running balance, total paid, total outstanding
   - Export to PDF

5. MEDRESA FEE OVERVIEW (Medresa Admin):
   - Monthly summary: total due, collected,
     outstanding, collection rate %
   - Drill down into monthly details

6. NETWORK FEE OVERVIEW (Super Admin):
   - Cross-medresa fee summary
   - Filters: by medresa, by month range

BUSINESS RULES TO ENFORCE:
- Only Super Admin sets fee structure
- Fee changes versioned — history never deleted
- One flat fee applies equally to all students
- Partial payments allowed, balance carries forward
- Bank transfer requires reference number
- Payment date cannot be future date
- Medresa Admin cannot edit/delete recorded payments
- Teachers have zero access to fee data

DATA MODELS:
  FeeStructure { id, monthly_amount, effective_from,
                 status, created_by, created_at, updated_at }
  FeePayment { id, student_id, medresa_id,
               fee_structure_id, month, year,
               amount_due, amount_paid, payment_method,
               bank_reference, payment_date, note,
               recorded_by, created_at, updated_at }
  FeeBalance { id, student_id, medresa_id,
               total_due, total_paid,
               outstanding_balance, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: set fee structure, get fee history,
  list students with payment status, record payment,
  get student fee history, get medresa overview,
  get network overview
- PDF export for student fee history
- Do NOT build salary here — that belongs to M09

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M09: Salary Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M09: Salary Management for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin, Teacher
- Salary module is Super Admin EXCLUSIVE —
  no other role has any access whatsoever
- Teachers are network-level entities
- Language support: Amharic, English, Arabic (RTL)

MODULE SCOPE — build exactly these features:

1. SALARY RANK MANAGEMENT (Super Admin only):
   - Create/edit/deactivate salary ranks
     (name, monthly amount in ETB)
   - Rank amount changes versioned with effective dates
   - View number of teachers per rank

2. ASSIGN RANK TO TEACHER (Super Admin only):
   - Assign one rank per teacher network-wide
   - Rank changes versioned with effective dates
   - View all teachers with current rank & salary

3. SALARY PAYMENT LIST (Super Admin only):
   - All teachers with rank, salary amount,
     monthly payment status (Paid/Unpaid)
   - System flags unpaid teachers for current month
   - Filters: by rank, status, month

4. RECORD SALARY PAYMENT (Super Admin only):
   - Fields: teacher, month/year, amount (auto-filled
     from rank, editable for adjustments),
     bank reference (required), payment date, note
   - One payment per teacher per month
   - Adjustments logged with reason

5. TEACHER SALARY HISTORY (Super Admin only):
   - Full payment history per teacher
   - Export to PDF

6. NETWORK SALARY OVERVIEW (Super Admin only):
   - Monthly summary: total teachers, paid, unpaid,
     total amount disbursed
   - Filters: by month range, by rank
   - Export to PDF

BUSINESS RULES TO ENFORCE:
- Super Admin exclusive — zero access for other roles
- One rank per teacher at a time, changes versioned
- One salary payment per teacher per month
- Bank reference mandatory for every payment
- Payment date cannot be future
- Amount adjustments logged with reason
- Deactivated teacher history preserved
- System flags unpaid teachers each month

DATA MODELS:
  SalaryRank { id, name, monthly_amount, effective_from,
               status, created_at, updated_at }
  TeacherRank { id, teacher_id, salary_rank_id,
                effective_from, created_at, updated_at }
  SalaryPayment { id, teacher_id, salary_rank_id,
                  month, year, amount_paid,
                  bank_reference, payment_date, note,
                  is_adjusted, adjustment_reason,
                  recorded_by, created_at, updated_at }

DELIVERABLES:
- Folder structure for this module
- All screens listed above
- API endpoints: manage ranks, assign rank to teacher,
  list teachers with payment status, record payment,
  get teacher salary history, get network overview
- Monthly unpaid teacher flagging logic
- PDF export for salary history and network overview
- Strict middleware: block all non-Super Admin access
- Do NOT build reporting dashboard here — that belongs to M10


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4, M10: Reporting & Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building M10: Reporting & Dashboard for the Harari
Medresa Management System (HMMS), a multi-tenant platform
for 20+ Islamic schools in Harari, Ethiopia.

MASTER CONTEXT:
- 3 roles: Super Admin, Medresa Admin, Teacher
- All dates displayed in Ethiopian calendar
  (Meskerem — Pagume), stored internally as Gregorian
- Language support: Amharic, English, Arabic (RTL)
- Salary data is Super Admin exclusive

MODULE SCOPE — build exactly these features:

1. TEACHER DASHBOARD:
   - Cards: total students, today's attendance rate,
     pending grade entries
   - Charts: attendance trend (30 days), grade
     distribution per course
   - Quick actions: take attendance, enter grades

2. MEDRESA ADMIN DASHBOARD:
   - Cards: total students, active courses,
     attendance rate, fees collected, outstanding fees
   - Charts: fee collection vs outstanding (bar),
     enrollment trend (line), attendance per course,
     grade average per course
   - Quick actions: record payment, view unpaid students

3. SUPER ADMIN DASHBOARD:
   - Cards: total medresas, teachers, students,
     fees collected, outstanding fees, salary disbursed,
     unpaid teachers count
   - Charts: enrollment per medresa, fee collection
     trend, salary disbursement trend, attendance
     per medresa, grade average per medresa
   - Quick actions: view unpaid teachers,
     view fee defaulters

4. EXPORTABLE REPORTS (PDF & Excel):
   R01. Student Enrollment Report
   R02. Attendance Report
   R03. Fee Collection Report
   R04. Salary Report (Super Admin only)
   R05. Grades & Results Report
   All filterable by Ethiopian calendar date ranges

BUSINESS RULES TO ENFORCE:
- All date display in Ethiopian calendar
- Dates stored as Gregorian, converted on display
- Role-scoped data: teachers see own data,
  admins see their medresa, super admin sees all
- Salary reports Super Admin only
- All exports timestamped in Ethiopian calendar
- Charts use live data

ETHIOPIAN DATE UTILITY (required):
  EthiopianDateUtil {
    toEthiopian(gregorianDate),
    toGregorian(ethiopianDate),
    getCurrentEthiopianYear(),
    getCurrentEthiopianMonth()
  }

DELIVERABLES:
- Folder structure for this module
- All 3 role-based dashboards
- All 5 exportable reports (PDF & Excel)
- Ethiopian calendar date conversion utility
- API endpoints: get dashboard data per role,
  generate each report with filters
- Chart components (use Chart.js or Recharts)
- No new database tables — reads from M01—M09


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 5: Tech Stack & Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building the Harari Medresa Management System (HMMS),
a web + PWA platform for 20+ Islamic schools in Harari,
Ethiopia. Here is the full tech stack and architecture.

TECH STACK:

FRONTEND:
  - React (Vite) + TypeScript
  - TanStack Router (routing)
  - TanStack Query (server state & data fetching)
  - Shadcn/ui + Tailwind CSS (UI components)
  - React Hook Form + Zod (forms & validation)
  - Recharts (charts & graphs)
  - jsPDF + SheetJS (PDF & Excel export)
  - Vite PWA Plugin (PWA + offline support)
  - i18next (Amharic, English, Arabic with RTL support)
  - ethiopian-date package (Ethiopian calendar)
  - Axios (HTTP client)

BACKEND:
  - Node.js + Express.js + TypeScript
  - JWT (access + refresh tokens)
  - Nodemailer (password reset emails)
  - Multer (photo uploads, max 2MB, jpg/png)
  - Zod (request validation)
  - Prisma ORM + PostgreSQL
  - node-cron (scheduled jobs)

DEVOPS:
  - Docker Compose (local dev)
  - VPS: Ubuntu 22.04, Nginx, PM2, Let's Encrypt

ARCHITECTURE:
  - REST API: /api/v1/ with one router per module
  - Middleware stack per request:
    CORS → Rate Limit → JWT Auth → Role Guard →
    Medresa Scope Guard → Zod Validator → Handler
  - Scheduled jobs:
    1. Midnight: lock attendance sessions
    2. Monthly: flag unpaid teacher salaries

FOLDER STRUCTURE:
  hmms/
  ├── frontend/src/
  │   ├── features/   (one folder per module)
  │   ├── routes/     (TanStack Router)
  │   ├── components/ (shared UI)
  │   └── lib/        (axios, i18n, date utils)
  └── backend/src/
      ├── modules/    (one folder per module)
      ├── middleware/ (auth, role, scope guards)
      ├── jobs/       (cron jobs)
      └── prisma/     (schema.prisma)

ROLES & ACCESS:
  - super_admin: full network access
  - medresa_admin: own medresa only (students & fees)
  - teacher: own courses only
  - Role stored per medresa in TeacherMedresa table

Use this as the master architecture reference for all
build prompts going forward.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 6: Database, Security & Standards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are setting up the complete database, security
architecture, and coding standards for the Harari
Medresa Management System (HMMS).

TECH STACK: Node.js + Express + Prisma + PostgreSQL
PLATFORM: Web + PWA | VPS hosted | 20+ medresas

━━━ TASK 1: PRISMA SCHEMA ━━━

Generate the complete schema.prisma file with all
models below. Apply these global conventions:
- UUID primary keys (@default(uuid()))
- created_at, updated_at on every model
- deleted_at (nullable) for soft delete
- JSONB (Json type) for multilingual fields:
  { "en": "...", "am": "...", "ar": "..." }
- Monetary amounts as Int (Ethiopian cents)
- Indexes on all FKs and frequent query fields
- Inline /// doc comments on every model

MODELS TO GENERATE:
  User, PasswordResetToken, RefreshToken,
  Medresa, Teacher, TeacherMedresa,
  Course, MedresaCourse, CourseAssignment,
  Student, StudentCourse, StudentTransfer,
  AttendanceSession, AttendanceRecord,
  ExamType, Grade, GradeEditRequest,
  FeeStructure, FeePayment, FeeBalance,
  SalaryRank, TeacherRank, SalaryPayment,
  AuditLog

ENUMS:
  UserStatus, Status, StudentStatus, MedresaRole,
  Gender, CourseLevel, AttendanceStatus,
  LetterGrade, PaymentMethod, ApprovalStatus,
  AuditAction

━━━ TASK 2: SECURITY SETUP ━━━

Generate the following security layers:

1. PostgreSQL RLS:
   - Create two DB roles: sefinet_app, sefinet_admin
   - Enable RLS on all tables
   - Write RLS policies for medresa data isolation
   - AuditLog table: INSERT only for sefinet_app

2. Express Middleware Stack (in order):
   - helmet() — HTTP security headers
   - cors() — whitelist frontend domain only
   - express-rate-limit — 100 req/min per IP
   - JWT auth verification (access token 15min)
   - Role guard — check is_super_admin or
     TeacherMedresa.role
   - Medresa scope guard — inject medresa_id
     from JWT into all queries automatically
   - Zod request validator

3. Auth Module:
   - Login: phone or email + password (bcrypt 12)
   - JWT: access token (15min) + refresh token
     (7 days, httpOnly cookie, stored hashed)
   - Refresh token rotation on every use
   - Password reset: email link, 1hr expiry,
     single use, stored hashed

4. File Upload Security:
   - Multer: jpg/png only, max 2MB
   - Filename sanitized (uuid rename)
   - Stored outside public directory

━━━ TASK 3: PERFORMANCE ━━━

1. Add composite indexes to schema:
   (medresa_id, status), (student_id, month, year),
   (teacher_id, month, year), (medresa_course_id, date)

2. Add partial indexes (WHERE deleted_at IS NULL)
   on all soft-deleted tables via raw SQL migration

3. Setup PgBouncer config for connection pooling

4. Setup node-cache for static data (1hr TTL):
   exam types, fee structure, salary ranks

5. Setup node-cron jobs:
   - Midnight: lock AttendanceSessions where
     date = today and is_locked = false
   - Monthly 1st: flag unpaid SalaryPayments

━━━ TASK 4: API STANDARDS ━━━

Generate a responseFormatter utility:
  success(data, meta?) → standard success response
  error(code, message, details?) → standard error

Generate standardized error codes enum:
  UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
  VALIDATION_ERROR, CONFLICT, INTERNAL_ERROR

Generate API versioning setup:
  app.use('/api/v1', v1Router)
  Response header: X-API-Version: 1.0

━━━ TASK 5: DOCUMENTATION ━━━

Generate the docs/ folder with:
  - architecture.md (system overview)
  - security.md (all 4 security layers explained)
  - database.md (schema conventions & decisions)
  - api-standards.md (response format, error codes,
    versioning, HTTP method conventions)

DELIVERABLES:
  1. prisma/schema.prisma (complete)
  2. src/middleware/ (all middleware files)
  3. src/modules/auth/ (complete auth module)
  4. src/lib/cache.ts (node-cache setup)
  5. src/jobs/ (cron jobs)
  6. src/utils/response.ts (response formatter)
  7. sql/rls-policies.sql (PostgreSQL RLS setup)
  8. docs/ (all markdown files)
  9. docker-compose.yml (app + postgres + pgbouncer)

  