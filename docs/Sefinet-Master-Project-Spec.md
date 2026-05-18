# Sefinet Al Neja
## Master Project Specification

> **Version:** 1.0
> **Date:** May 2026
> **Location:** Harari, Ethiopia
> **Platform:** Web + PWA
> **Languages:** Amharic · English · Arabic (RTL)
> **Calendar:** Ethiopian (Meskerem — Pagume)

---

## Table of Contents

1. [Phase 1 — Idea Investigation](#phase-1--idea-investigation)
2. [Phase 2 — System Understanding](#phase-2--system-understanding)
3. [Phase 3 — Module Decomposition](#phase-3--module-decomposition)
4. [Phase 4 — Deep Module Analysis](#phase-4--deep-module-analysis)
   - [M01 User & Role Management](#m01-user--role-management)
   - [M02 Medresa Management](#m02-medresa-management)
   - [M03 Teacher Management](#m03-teacher-management)
   - [M04 Course Management](#m04-course-management)
   - [M05 Student Management](#m05-student-management)
   - [M06 Attendance Tracking](#m06-attendance-tracking)
   - [M07 Grades & Results](#m07-grades--results)
   - [M08 Fee Management](#m08-fee-management)
   - [M09 Salary Management](#m09-salary-management)
   - [M10 Reporting & Dashboard](#m10-reporting--dashboard)
5. [Phase 5 — Tech Stack & Architecture](#phase-5--tech-stack--architecture)
6. [Phase 6 — Database, Security, Performance & Standards](#phase-6--database-security-performance--standards)
7. [AI Build Prompts Reference](#ai-build-prompts-reference)

---

## Phase 1 — Idea Investigation

### Problem Statement

The Harari medresa network (20+ schools) operates in full isolation. Student records are scattered and frequently lost. Fee collection is informal and inconsistent. Teacher salaries are uncoordinated across schools. No authority has a unified view of the network's health, enrollment, or finances.

### Vision

A centralized, multi-tenant platform where each medresa manages its own students, teachers, fees, and salaries — while a super-admin monitors the entire network from one dashboard.

### Core Pain Points

| # | Pain Point |
|---|-----------|
| 1 | Student records scattered and lost across medresas |
| 2 | Fee collection untracked and inconsistent |
| 3 | Teacher salaries hard to manage across schools |
| 4 | No central network-wide visibility |

### Access Model

| Role | Scope |
|------|-------|
| Medresa Admin | Sees and manages only their own medresa |
| Super Admin | Full read/write access across all 20+ medresas |

### Success Looks Like

- Every medresa has a digital record of all students and teachers
- Fee payments are logged and trackable per student
- Salaries are calculated and recorded per teacher per medresa
- Super Admin can pull network-wide reports at any time

---

## Phase 2 — System Understanding

### Actor Model (3-Tier Role System)

#### 1. Super Admin (1 global account)

- Full access across all 20+ medresas
- Create / edit / deactivate medresas
- Create teacher accounts (network-level)
- Assign / remove medresa admin role to any teacher
- Manage salary: set scales, process and record payments
- Set fee structures per medresa
- Generate network-wide reports (enrollment, fees, salaries)
- View all data across all medresas

#### 2. Medresa Admin (a teacher elevated per medresa)

- A teacher can be admin in one medresa and regular teacher in another
- A teacher can be admin in **multiple medresas simultaneously** (fully flexible)
- Inherits all regular teacher permissions within their medresa
- Add / remove **students** in their medresa (NOT teachers)
- Record and track student fee payments
- Generate medresa-level reports
- **Cannot manage salaries** (Super Admin only)
- **Cannot manage teachers** (Super Admin only)

#### 3. Teacher (base role, network-level entity)

- Belongs to the network, can be assigned to 1 or more medresas
- View own profile and assignments across medresas
- View their class roster and student profiles
- Record student attendance (per class, per medresa)
- Enter student grades / results
- Cannot access fee or salary data

### Key Architectural Notes

**Multi-Medresa Teacher:**
- Teacher is a network-level entity (not owned by one medresa)
- `teacher_medresa` join table tracks which medresas a teacher belongs to
- A teacher's role (teacher vs admin) is scoped per medresa
- Example: Ustaz Ahmed = Admin at Medresa A, Teacher at Medresa B, Admin at Medresa C

**Salary Ownership:**
- Salary module is Super Admin only
- Medresa Admins have zero visibility into salary data

### Access Matrix

| Role | Own Medresa | Other Medresas | Network-wide |
|------|-------------|----------------|--------------|
| Teacher | Own data only | None | None |
| Medresa Admin | Full (except salary) | None | None |
| Super Admin | Full | Full | Full |

---

## Phase 3 — Module Decomposition

### Build Order

```
TIER 1 — FOUNDATION
  M01. User & Role Management
  M02. Medresa Management
  M03. Teacher Management

TIER 2 — CORE
  M04. Course Management
  M05. Student Management

TIER 3 — OPERATIONAL
  M06. Attendance Tracking
  M07. Grades & Results
  M08. Fee Management
  M09. Salary Management

TIER 4 — INSIGHTS
  M10. Reporting & Dashboard
```

### Permission Matrix

| Module | Super Admin | Medresa Admin | Teacher |
|--------|-------------|---------------|---------|
| User & Role Management | Full | None | None |
| Medresa Management | Full | View own | None |
| Teacher Management | Full | None | Own profile |
| Course Management | Full | Assign only | View own |
| Student Management | Full | Full | View own class |
| Attendance Tracking | View | View | Full |
| Grades & Results | View | View + Approve | Full |
| Fee Management | Full | Full | None |
| Salary Management | Full | None | None |
| Reporting & Dashboard | Network-wide | Own medresa | Own data |

### Module Dependency Map

```
M01 → M02 → M03 → M04 → M05 → M06
                              ↘ M07
                         M08 ↗
                    M09 ↗
                         → M10
```

---

## Phase 4 — Deep Module Analysis

---

### M01: User & Role Management

**Owner:** Super Admin
**Depends on:** Nothing (foundation module)

#### Screens

| Screen | Access |
|--------|--------|
| Login | All users |
| Forgot Password | All users |
| Set New Password | All users |
| User List | Super Admin |
| Create / Edit User | Super Admin |
| Deactivate User Dialog | Super Admin |

**Login Screen**
- Fields: Phone or Email, Password
- On success: redirect by role
  - Super Admin → network dashboard
  - Medresa Admin → their medresa dashboard
  - Teacher → their classes dashboard

**Forgot Password Screen**
- Fields: Email address
- Time-limited reset link (expires in 1 hour)
- Generic message if email not found (no user enumeration)

**User List Screen**
- Columns: Full Name, Phone, Email, Assigned Medresas, Role per Medresa, Status
- Filters: By medresa, by role, by status

**Create / Edit User Screen**
- Fields: Full Name, Phone Number, Email, Password (auto-generated), Status
- Role assignment done inside Teacher Management (M03)

**Deactivate User Dialog**
- Confirmation required before deactivation
- Account status → Inactive, session invalidated immediately
- All historical records preserved
- Super Admin can reactivate at any time

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can create, edit, or deactivate accounts |
| BR-02 | A deactivated account loses access immediately |
| BR-03 | Historical data of deactivated teachers is never deleted |
| BR-04 | Password reset only works via email |
| BR-05 | Reset links expire after 1 hour |
| BR-06 | Super Admin account cannot be deactivated |
| BR-07 | Login identifier can be phone OR email interchangeably |

#### Data Entities

```
User {
  id, full_name, phone, email,
  password_hash, status (active/inactive),
  is_super_admin (bool),
  created_at, updated_at
}

PasswordResetToken {
  id, user_id, token_hash,
  expires_at, used (bool), created_at
}
```

---

### M02: Medresa Management

**Owner:** Super Admin
**Depends on:** M01

#### Screens

| Screen | Access |
|--------|--------|
| Medresa List | Super Admin |
| Create / Edit Medresa | Super Admin |
| Medresa Detail | Super Admin |
| Deactivate Medresa Dialog | Super Admin |

**Medresa List Screen**
- Columns: Name, Location, Phone, Total Students, Total Teachers, Status
- Filters: By status, by location

**Create / Edit Medresa Screen**
- Fields: Medresa Name (required), Location (required), Phone Number (optional)

**Medresa Detail Screen**
- Displays: info, assigned teachers, student count, active courses, status

**Deactivate Medresa Dialog**
- Hides medresa from network but preserves all data
- Medresa Admins and teachers of that medresa lose access immediately
- Super Admin can reactivate at any time

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can create, edit, or deactivate medresas |
| BR-02 | Medresa name must be unique across the network |
| BR-03 | Deactivating a medresa does NOT delete any data |
| BR-04 | Deactivated medresas are hidden from all non-super-admin views |
| BR-05 | A medresa must exist before teachers or students can be assigned |
| BR-06 | Phone number is optional but must be valid if provided |
| BR-07 | Fee structure is network-wide — not stored per medresa (M08) |

#### Data Entities

```
Medresa {
  id, name, location, phone (nullable),
  status (active/inactive),
  created_at, updated_at
}
```

---

### M03: Teacher Management

**Owner:** Super Admin
**Depends on:** M01, M02

#### Screens

| Screen | Access |
|--------|--------|
| Teacher List | Super Admin |
| Create / Edit Teacher | Super Admin |
| Teacher Detail | Super Admin |
| Assign to Medresa | Super Admin |
| Teacher Own Profile | Teacher (read only) |

**Teacher List Screen**
- Columns: Photo, Full Name, Phone, Email, Specialization, Date Joined, Assigned Medresas, Status
- Filters: By medresa, by status, by specialization

**Create / Edit Teacher Screen**
- Fields: Full Name, Phone, Email, Subject Specialization, Date Joined, Photo (optional)
- On create: system auto-creates a User account and sends password reset email

**Assign to Medresa Screen**
- Mode 1 — Single: select medresa, select role, set date
- Mode 2 — Bulk: select multiple medresas, set role per medresa individually

**Teacher Own Profile**
- Read-only view of own info and list of assigned medresas with role in each

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can create, edit, assign, or deactivate teachers |
| BR-02 | Creating a teacher automatically creates a linked User account |
| BR-03 | A teacher can be assigned to any number of medresas |
| BR-04 | A teacher can hold Admin role in any number of medresas simultaneously |
| BR-05 | Role is fully scoped per medresa — no network-wide role |
| BR-06 | Removing a teacher from a medresa preserves their historical data |
| BR-07 | Deactivating a teacher revokes access to all medresas immediately |
| BR-08 | Teacher must be assigned to a medresa before course assignment (M04) |
| BR-09 | Photo optional, jpg/png only, max 2MB |

#### Data Entities

```
Teacher {
  id, user_id (FK → User),
  full_name, phone, email,
  specialization, date_joined,
  photo_url (nullable),
  status (active/inactive),
  created_at, updated_at
}

TeacherMedresa {
  id, teacher_id (FK → Teacher),
  medresa_id (FK → Medresa),
  role (enum: teacher / admin),
  assigned_since,
  created_at, updated_at
}
```

---

### M04: Course Management

**Owner:** Super Admin (master list), Medresa Admin (activation & assignment)
**Depends on:** M01, M02, M03

#### Screens

| Screen | Access |
|--------|--------|
| Master Course List | Super Admin |
| Create / Edit Course | Super Admin |
| Medresa Course List | Medresa Admin |
| Activate Course | Medresa Admin |
| Assign Teacher to Course | Medresa Admin |
| Course Detail | Medresa Admin, Teacher |

**Master Course List**
- Columns: Course Name, Description, Level, Used By (medresa count), Status

**Medresa Course List**
- Columns: Course Name, Level, Assigned Teacher, Students Enrolled

**Assign Teacher to Course**
- One teacher per course per medresa
- Teacher must already be assigned to that medresa

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can create, edit, or deactivate master courses |
| BR-02 | Course name must be unique across the network |
| BR-03 | Medresa Admin can only activate/deactivate courses within their medresa |
| BR-04 | Course must be activated in a medresa before teachers or students can be assigned |
| BR-05 | One teacher assigned per course per medresa |
| BR-06 | A teacher can be assigned to multiple courses in the same medresa |
| BR-07 | A teacher can teach the same or different courses across different medresas |
| BR-08 | Deactivating a master course preserves all historical data |
| BR-09 | Medresa course deactivation affects only that medresa |

#### Data Entities

```
Course {
  id, name (Json multilingual), description (Json multilingual),
  level (beginner/intermediate/advanced),
  status (active/inactive),
  created_at, updated_at
}

MedresaCourse {
  id, medresa_id (FK → Medresa),
  course_id (FK → Course),
  status (active/inactive),
  activated_at, created_at, updated_at
}

CourseAssignment {
  id, medresa_course_id (FK → MedresaCourse),
  teacher_id (FK → Teacher),
  assigned_since,
  created_at, updated_at
}
```

---

### M05: Student Management

**Owner:** Medresa Admin
**Depends on:** M01, M02, M03, M04

#### Screens

| Screen | Access |
|--------|--------|
| Student List | Medresa Admin |
| Enroll / Edit Student | Medresa Admin |
| Student Detail | Medresa Admin, Teacher (read only) |
| Assign to Course | Medresa Admin |
| Transfer Student | Medresa Admin |
| Student List (own courses) | Teacher (read only) |

**Student List Screen**
- Columns: Photo, Full Name, Gender, Guardian Phone, Enrolled Courses, Status
- Filters: By gender, by course, by status

**Enroll Student Screen**
- Fields: Full Name, Date of Birth, Gender, Address, Guardian Name, Guardian Phone, Photo (optional)

**Transfer Student Screen**
- Fields: Destination medresa, transfer date, reason (optional)
- Status in current medresa → Transferred
- All historical data preserved
- Destination admin must re-assign courses manually

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Medresa Admin can enroll, edit, or transfer students |
| BR-02 | A student belongs to exactly one medresa at a time |
| BR-03 | Transferring preserves all historical data in the previous medresa |
| BR-04 | After transfer, destination admin must manually assign courses |
| BR-05 | Student can only be assigned to courses that are active with an assigned teacher |
| BR-06 | Teachers can view students in their courses only |
| BR-07 | Super Admin can view all students network-wide (read only) |
| BR-08 | Photo optional, max 2MB, jpg/png only |
| BR-09 | Guardian phone must be valid Ethiopian format |
| BR-10 | Enrollment date auto-recorded on creation |

#### Data Entities

```
Student {
  id, full_name, date_of_birth, gender (male/female),
  address, guardian_name, guardian_phone,
  photo_url (nullable),
  current_medresa_id (FK → Medresa),
  status (active/transferred),
  enrolled_at, created_at, updated_at
}

StudentCourse {
  id, student_id (FK → Student),
  medresa_course_id (FK → MedresaCourse),
  enrolled_at, created_at, updated_at
}

StudentTransfer {
  id, student_id (FK → Student),
  from_medresa_id (FK → Medresa),
  to_medresa_id (FK → Medresa),
  transfer_date, reason (nullable),
  created_at
}
```

---

### M06: Attendance Tracking

**Owner:** Teacher (record), Medresa Admin (view), Super Admin (view all)
**Depends on:** M01, M02, M03, M04, M05

#### Screens

| Screen | Access |
|--------|--------|
| Attendance Taking | Teacher |
| Edit Attendance | Teacher (same day only) |
| Attendance History | Teacher |
| Student Attendance Detail | Teacher |
| Medresa Attendance Overview | Medresa Admin |
| Network Attendance Overview | Super Admin |

**Attendance Taking Screen**
- Default status: Absent for all students
- Statuses: Present / Absent / Late / Excused
- Optional note per student
- Submit locks record for the day

**Edit Attendance Screen**
- Same-day edits only — locked after midnight
- Edit timestamp logged on any change

**Medresa Attendance Overview**
- Columns: Course, Teacher, Present, Absent, Late, Excused, Total Students
- Drill down into any course's attendance

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only teachers can record and edit attendance |
| BR-02 | Attendance recorded once per day per student |
| BR-03 | Default status for all students is Absent |
| BR-04 | Teacher can only edit attendance on the same calendar day |
| BR-05 | After midnight, attendance is permanently locked |
| BR-06 | Edit timestamp is logged when attendance is corrected |
| BR-07 | Teacher can only take attendance for their assigned courses |
| BR-08 | Attendance cannot be taken for future dates |
| BR-09 | Medresa Admin can view but NOT edit attendance |
| BR-10 | Super Admin can view all attendance but cannot edit |

#### Data Entities

```
AttendanceSession {
  id, medresa_course_id (FK → MedresaCourse),
  teacher_id (FK → Teacher),
  date, submitted_at,
  is_locked (bool),
  created_at, updated_at
}

AttendanceRecord {
  id, session_id (FK → AttendanceSession),
  student_id (FK → Student),
  status (present/absent/late/excused),
  note (nullable),
  edited_at (nullable),
  created_at, updated_at
}
```

---

### M07: Grades & Results

**Owner:** Teacher (record & edit request), Medresa Admin (approve edits & view), Super Admin (manage exam types, approve & view all)
**Depends on:** M01, M02, M03, M04, M05

#### Screens

| Screen | Access |
|--------|--------|
| Exam Type Management | Super Admin |
| Grade Entry | Teacher |
| Grade Edit Request | Teacher |
| Grade Edit Approval | Medresa Admin, Super Admin |
| Student Results | Teacher, Medresa Admin |
| Class Results | Teacher |
| Medresa Results Overview | Medresa Admin |
| Network Results Overview | Super Admin |

**Exam Type Management**
- Fields: Name (multilingual), Max Score, Weight (%)
- All active exam type weights must sum to 100%

**Grade Entry Screen**
- Teacher selects exam type first
- Enters numeric score per student
- Letter grade auto-calculated:
  - 90–100 → A | 80–89 → B | 70–79 → C | 60–69 → D | Below 60 → F

**Grade Edit Request Flow**
- Teacher submits request with reason
- Grade unchanged until approved
- Medresa Admin or Super Admin approves / rejects
- Teacher notified of outcome

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can create/edit exam types |
| BR-02 | Exam type weights must sum to 100% |
| BR-03 | Letter grade is auto-calculated from numeric score |
| BR-04 | Teacher can only enter grades for their assigned courses |
| BR-05 | Grade edits require Medresa Admin or Super Admin approval |
| BR-06 | Grade is unchanged until edit is approved |
| BR-07 | All edit requests and approvals are logged |
| BR-08 | Medresa Admin cannot directly edit grades |
| BR-09 | Super Admin can approve grade edits for any medresa |
| BR-10 | Grade cannot be entered for a student not enrolled in that course |

#### Data Entities

```
ExamType {
  id, name (Json multilingual), max_score,
  weight (%), status (active/inactive),
  created_at, updated_at
}

Grade {
  id, student_id (FK → Student),
  medresa_course_id (FK → MedresaCourse),
  exam_type_id (FK → ExamType),
  teacher_id (FK → Teacher),
  numeric_score, letter_grade,
  submitted_at, created_at, updated_at
}

GradeEditRequest {
  id, grade_id (FK → Grade),
  requested_by (FK → Teacher),
  current_score, requested_score,
  reason, status (pending/approved/rejected),
  reviewed_by (FK → User, nullable),
  reviewed_at (nullable),
  rejection_reason (nullable),
  created_at, updated_at
}
```

---

### M08: Fee Management

**Owner:** Super Admin (fee structure), Medresa Admin (payment recording)
**Depends on:** M01, M02, M03, M05

#### Screens

| Screen | Access |
|--------|--------|
| Fee Structure | Super Admin |
| Fee Collection List | Medresa Admin |
| Record Payment | Medresa Admin |
| Student Fee History | Medresa Admin |
| Medresa Fee Overview | Medresa Admin |
| Network Fee Overview | Super Admin |

**Fee Structure Screen**
- One active fee amount at a time (in ETB)
- Changing fee creates new versioned record with effective date
- Full fee history preserved

**Fee Collection Screen**
- Columns: Photo, Student Name, Month, Amount Due, Amount Paid, Balance, Status
- Status: Paid / Partial / Unpaid

**Record Payment Screen**
- Fields: Student, Month/Year, Amount Paid, Payment Method (Cash/Bank Transfer), Bank Reference (required if bank transfer), Payment Date, Note
- Partial payments allowed — balance tracked automatically
- Multiple payments per student per month allowed

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Only Super Admin can set or change the network-wide monthly fee |
| BR-02 | Fee amount changes are versioned — history never deleted |
| BR-03 | One flat monthly fee applies to all students equally |
| BR-04 | Medresa Admin records payments for their medresa only |
| BR-05 | Partial payments are allowed — balance tracked automatically |
| BR-06 | Multiple payments can be recorded per student per month |
| BR-07 | Bank transfer payments must include a bank reference number |
| BR-08 | Payment date cannot be a future date |
| BR-09 | Medresa Admin cannot edit or delete a recorded payment |
| BR-10 | Outstanding balances carry forward month to month |
| BR-11 | Teachers have no access to fee data |

#### Data Entities

```
FeeStructure {
  id, monthly_amount (ETB cents),
  effective_from, status (active/inactive),
  created_by (FK → User),
  created_at, updated_at
}

FeePayment {
  id, student_id (FK → Student),
  medresa_id (FK → Medresa),
  fee_structure_id (FK → FeeStructure),
  month, year,
  amount_due, amount_paid,
  payment_method (cash/bank_transfer),
  bank_reference (nullable),
  payment_date, note (nullable),
  recorded_by (FK → User),
  created_at, updated_at
}

FeeBalance {
  id, student_id (FK → Student),
  medresa_id (FK → Medresa),
  total_due, total_paid,
  outstanding_balance,
  updated_at
}
```

---

### M09: Salary Management

**Owner:** Super Admin exclusively
**Depends on:** M01, M02, M03

#### Screens

| Screen | Access |
|--------|--------|
| Salary Rank Management | Super Admin |
| Assign Rank to Teacher | Super Admin |
| Salary Payment List | Super Admin |
| Record Salary Payment | Super Admin |
| Teacher Salary History | Super Admin |
| Network Salary Overview | Super Admin |

**Salary Rank Management**
- Fields: Rank Name (multilingual), Monthly Amount (ETB), Effective From Date
- Rank changes are versioned — history preserved
- Examples: Rank 1 (Junior), Rank 2 (Mid), Rank 3 (Senior), Rank 4 (Principal)

**Record Salary Payment Screen**
- Fields: Teacher, Month/Year, Amount (auto-filled from rank), Bank Reference (required), Payment Date, Note
- One payment per teacher per month
- Amount adjustments logged with reason
- System flags unpaid teachers for current month

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | Salary module is exclusively Super Admin — no other role has any access |
| BR-02 | Salary determined by network-wide rank (not per medresa) |
| BR-03 | A teacher has exactly one rank at a time |
| BR-04 | Rank changes are versioned with effective dates |
| BR-05 | Rank amount changes are versioned — history never deleted |
| BR-06 | One salary payment recorded per teacher per month |
| BR-07 | Bank reference number is mandatory for every payment |
| BR-08 | Payment date cannot be a future date |
| BR-09 | Amount adjustments are logged with reason |
| BR-10 | System flags unpaid teachers for current month |
| BR-11 | Deactivated teacher history preserved |
| BR-12 | Medresa Admins and Teachers have zero visibility into salary |

#### Data Entities

```
SalaryRank {
  id, name (Json multilingual),
  monthly_amount (ETB cents),
  effective_from, status (active/inactive),
  created_at, updated_at
}

TeacherRank {
  id, teacher_id (FK → Teacher),
  salary_rank_id (FK → SalaryRank),
  effective_from,
  created_at, updated_at
}

SalaryPayment {
  id, teacher_id (FK → Teacher),
  salary_rank_id (FK → SalaryRank),
  month, year,
  amount_paid (ETB cents),
  bank_reference (required),
  payment_date, note (nullable),
  is_adjusted (bool),
  adjustment_reason (nullable),
  recorded_by (FK → User),
  created_at, updated_at
}
```

---

### M10: Reporting & Dashboard

**Owner:** All roles (scoped by role)
**Depends on:** All modules M01–M09
**Calendar:** Ethiopian (Meskerem — Pagume)

#### Dashboards by Role

**Teacher Dashboard**

| Element | Content |
|---------|---------|
| Summary Cards | Total students, today's attendance rate, pending grade entries |
| Charts | Attendance trend (30 days), grade distribution per course |
| Quick Actions | Take attendance, enter grades, view class roster |

**Medresa Admin Dashboard**

| Element | Content |
|---------|---------|
| Summary Cards | Total students, active courses, attendance rate, fees collected, outstanding fees |
| Charts | Fee collection vs outstanding (bar), enrollment trend (line), attendance per course, grade average per course |
| Quick Actions | Record payment, view unpaid students, generate monthly report |

**Super Admin Dashboard**

| Element | Content |
|---------|---------|
| Summary Cards | Total medresas, teachers, students, fees collected, outstanding fees, salary disbursed, unpaid teachers count |
| Charts | Enrollment per medresa, fee collection trend, salary disbursement trend, attendance per medresa, grade average per medresa |
| Quick Actions | View unpaid teachers, view fee defaulters, generate network report |

#### Exportable Reports

| Code | Report | Scope | Export |
|------|--------|-------|--------|
| R01 | Student Enrollment Report | Per medresa / Network-wide | PDF, Excel |
| R02 | Attendance Report | Per course / Per medresa / Network-wide | PDF, Excel |
| R03 | Fee Collection Report | Per medresa / Network-wide | PDF, Excel |
| R04 | Salary Report | Network-wide (Super Admin only) | PDF, Excel |
| R05 | Grades & Results Report | Per course / Per medresa / Network-wide | PDF, Excel |

#### Business Rules

| Code | Rule |
|------|------|
| BR-01 | All date inputs and displays use Ethiopian calendar |
| BR-02 | System stores dates in Gregorian internally, converts for display |
| BR-03 | Teachers export only their own course reports |
| BR-04 | Medresa Admins export only their medresa reports |
| BR-05 | Super Admin exports any report network-wide |
| BR-06 | Salary reports are Super Admin only |
| BR-07 | All exports timestamped with generation date in Ethiopian calendar |
| BR-08 | Charts refresh in real time from live data |

---

## Phase 5 — Tech Stack & Architecture

### Tech Stack

#### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React (Vite) + TypeScript |
| Routing | TanStack Router |
| Data Fetching | TanStack Query |
| UI Components | Shadcn/ui + Tailwind CSS |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| PDF Export | jsPDF |
| Excel Export | SheetJS (xlsx) |
| PWA | Vite PWA Plugin (Workbox) |
| Internationalization | i18next (Amharic, English, Arabic + RTL) |
| Ethiopian Calendar | ethiopian-date npm package |
| HTTP Client | Axios |

#### Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Authentication | JWT (access + refresh tokens) |
| Password Reset | Nodemailer |
| File Upload | Multer |
| Validation | Zod |
| ORM | Prisma |
| Scheduler | node-cron |

#### Database & Storage

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL |
| File Storage | Local disk (dev) → VPS / S3-compatible (production) |

#### DevOps

| Layer | Technology |
|-------|-----------|
| Local Dev | Docker Compose |
| Version Control | Git + GitHub |
| VPS OS | Ubuntu 22.04 LTS |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) |

### System Architecture

```
CLIENT (Browser / PWA)
  └── React + TanStack Router + TanStack Query
        ├── Public routes: Login, Forgot Password
        └── Protected routes (JWT guarded):
              ├── /super-admin/*  → Super Admin layout
              ├── /admin/*        → Medresa Admin layout
              └── /teacher/*     → Teacher layout

API LAYER (Express.js REST API)
  └── /api/v1/
        ├── /auth          → M01 Auth
        ├── /users         → M01 User management
        ├── /medresas      → M02
        ├── /teachers      → M03
        ├── /courses       → M04
        ├── /students      → M05
        ├── /attendance    → M06
        ├── /grades        → M07
        ├── /fees          → M08
        ├── /salaries      → M09
        └── /reports       → M10

MIDDLEWARE STACK (per request)
  1. CORS
  2. Rate Limiter (100 req/min per IP)
  3. JWT Auth Verification
  4. Role Guard
  5. Medresa Scope Guard (data isolation)
  6. Zod Request Validator
  7. Route Handler
  8. Error Handler

SCHEDULED JOBS (node-cron)
  └── Midnight:  lock submitted attendance sessions
  └── Monthly:   flag unpaid teacher salaries
```

### Folder Structure

```
hmms/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/        # shared UI components
│       ├── features/          # one folder per module
│       │   ├── auth/
│       │   ├── medresas/
│       │   ├── teachers/
│       │   ├── courses/
│       │   ├── students/
│       │   ├── attendance/
│       │   ├── grades/
│       │   ├── fees/
│       │   ├── salaries/
│       │   └── reports/
│       ├── hooks/             # shared custom hooks
│       ├── lib/               # axios, i18n, date utils
│       ├── routes/            # TanStack Router routes
│       ├── store/             # global client state
│       └── main.tsx
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── modules/           # one folder per module
│       │   ├── auth/
│       │   ├── medresas/
│       │   ├── teachers/
│       │   ├── courses/
│       │   ├── students/
│       │   ├── attendance/
│       │   ├── grades/
│       │   ├── fees/
│       │   ├── salaries/
│       │   └── reports/
│       ├── middleware/        # auth, role, scope guards
│       ├── jobs/              # cron jobs
│       ├── lib/               # mailer, storage, date util
│       └── utils/
│
├── docs/                      # markdown documentation
├── docker-compose.yml
└── README.md
```

### PWA Configuration

| Setting | Value |
|---------|-------|
| Installable | Yes (Add to Home Screen on Android/iOS) |
| Offline Support | Login page + last loaded dashboard cached |
| Sync | TanStack Query refetches on reconnect |
| Theme Color | Islamic green (#1B6B3A) |

---

## Phase 6 — Database, Security, Performance & Standards

### Security Architecture

#### Layer 1 — Network Level

- VPS firewall (UFW): only ports 22, 80, 443 open
- PostgreSQL port 5432 NOT exposed to public internet
- Nginx reverse proxy — API never directly exposed
- SSL/TLS enforced on all connections (Let's Encrypt)
- Rate limiting: 100 req/min per IP (`express-rate-limit`)
- `helmet.js`: HTTP security headers on all responses
- CORS: whitelist frontend domain only

#### Layer 2 — Application Level

- JWT access token (15 min expiry)
- JWT refresh token (7 days, stored in httpOnly cookie)
- Refresh token rotation on every use
- Refresh tokens stored hashed in DB
- Role Guard middleware: checks user role per route
- Medresa Scope Guard: injects `medresa_id` from JWT, all queries filtered automatically
- Zod validation on every incoming request body
- File upload: type check (jpg/png only), max 2MB, filename sanitized, stored outside public directory
- Password: bcrypt hashed (salt rounds: 12)
- Password reset token: hashed before storage, expires 1 hour, single use only
- No sensitive data in JWT payload

#### Layer 3 — Database Level (PostgreSQL RLS)

- Two DB roles: `sefinet_app` (limited, used by app) and `sefinet_admin` (full, migrations only)
- `sefinet_app` has NO direct table access — all access via DB functions and views with `SECURITY DEFINER`
- Row Level Security (RLS) enabled on all tables
- RLS policies enforce `medresa_id` isolation at engine level
- Audit log written via DB triggers — cannot be bypassed by application code
- Soft deletes enforced at DB level

#### Layer 4 — Audit Level

- Every INSERT, UPDATE, soft-DELETE on critical tables triggers an audit log entry
- Audit log is **append-only** — no UPDATE/DELETE allowed even for Super Admin
- Audit captures: table, record_id, action, old_values (JSONB), new_values (JSONB), performed_by, performed_at, ip_address

### Database Schema Conventions

| Convention | Detail |
|-----------|--------|
| Primary Keys | UUID (`@default(uuid())`) — prevents enumeration attacks |
| Soft Delete | `deleted_at` (nullable timestamp) on all critical tables |
| Multilingual Fields | JSONB: `{ "en": "...", "am": "...", "ar": "..." }` |
| Monetary Amounts | Integer (Ethiopian cents) — e.g. 50000 = 500.00 ETB |
| Date Storage | Gregorian internally, converted to Ethiopian for display |
| Indexes | All foreign keys + frequent query fields |
| Timestamps | `created_at`, `updated_at` on every table |

### Complete Prisma Schema

```prisma
// ── ENUMS ───────────────────────────────────────

enum UserStatus       { ACTIVE INACTIVE }
enum Status           { ACTIVE INACTIVE }
enum StudentStatus    { ACTIVE TRANSFERRED }
enum MedresaRole      { TEACHER ADMIN }
enum Gender           { MALE FEMALE }
enum CourseLevel      { BEGINNER INTERMEDIATE ADVANCED }
enum AttendanceStatus { PRESENT ABSENT LATE EXCUSED }
enum LetterGrade      { A B C D F }
enum PaymentMethod    { CASH BANK_TRANSFER }
enum ApprovalStatus   { PENDING APPROVED REJECTED }
enum AuditAction      { INSERT UPDATE SOFT_DELETE }

// ── M01: USER & AUTH ────────────────────────────

/// Stores all system users (super admin & teachers)
model User {
  id             String     @id @default(uuid())
  full_name      String
  phone          String     @unique
  email          String     @unique
  password_hash  String
  is_super_admin Boolean    @default(false)
  status         UserStatus @default(ACTIVE)
  deleted_at     DateTime?
  teacher        Teacher?
  reset_tokens   PasswordResetToken[]
  refresh_tokens RefreshToken[]
  audit_logs     AuditLog[]
  created_at     DateTime   @default(now())
  updated_at     DateTime   @updatedAt

  @@index([email])
  @@index([phone])
  @@index([status])
}

/// Password reset tokens — hashed, single use, 1hr expiry
model PasswordResetToken {
  id         String   @id @default(uuid())
  user_id    String
  token_hash String   @unique
  expires_at DateTime
  used       Boolean  @default(false)
  user       User     @relation(fields: [user_id], references: [id])
  created_at DateTime @default(now())

  @@index([token_hash])
  @@index([user_id])
}

/// Refresh tokens — rotated on every use, stored hashed
model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token_hash String   @unique
  expires_at DateTime
  revoked    Boolean  @default(false)
  user       User     @relation(fields: [user_id], references: [id])
  created_at DateTime @default(now())

  @@index([token_hash])
  @@index([user_id])
}

// ── M02: MEDRESA ────────────────────────────────

/// Islamic school in the Harari network
model Medresa {
  id               String           @id @default(uuid())
  name             String           @unique
  location         String
  phone            String?
  status           Status           @default(ACTIVE)
  deleted_at       DateTime?
  teacher_medresas TeacherMedresa[]
  students         Student[]
  medresa_courses  MedresaCourse[]
  fee_payments     FeePayment[]
  fee_balances     FeeBalance[]
  salary_payments  SalaryPayment[]
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  @@index([status])
}

// ── M03: TEACHER ────────────────────────────────

/// Network-level teacher entity — not owned by one medresa
model Teacher {
  id                  String             @id @default(uuid())
  user_id             String             @unique
  full_name           String
  phone               String             @unique
  email               String             @unique
  /// { "en": "Quran", "am": "ቁርአን", "ar": "القرآن" }
  specialization      Json
  date_joined         DateTime
  photo_url           String?
  status              Status             @default(ACTIVE)
  deleted_at          DateTime?
  user                User               @relation(fields: [user_id], references: [id])
  teacher_medresas    TeacherMedresa[]
  teacher_ranks       TeacherRank[]
  salary_payments     SalaryPayment[]
  course_assignments  CourseAssignment[]
  attendance_sessions AttendanceSession[]
  grades              Grade[]
  grade_edit_requests GradeEditRequest[]
  created_at          DateTime           @default(now())
  updated_at          DateTime           @updatedAt

  @@index([status])
  @@index([user_id])
}

/// Teacher role scoped per medresa
model TeacherMedresa {
  id             String      @id @default(uuid())
  teacher_id     String
  medresa_id     String
  role           MedresaRole @default(TEACHER)
  assigned_since DateTime    @default(now())
  deleted_at     DateTime?
  teacher        Teacher     @relation(fields: [teacher_id], references: [id])
  medresa        Medresa     @relation(fields: [medresa_id], references: [id])
  created_at     DateTime    @default(now())
  updated_at     DateTime    @updatedAt

  @@unique([teacher_id, medresa_id])
  @@index([medresa_id])
  @@index([teacher_id])
  @@index([role])
}

// ── M04: COURSE ─────────────────────────────────

/// Master course list — network-wide
model Course {
  id              String          @id @default(uuid())
  /// { "en": "Quran Recitation", "am": "...", "ar": "..." }
  name            Json
  description     Json
  level           CourseLevel
  status          Status          @default(ACTIVE)
  deleted_at      DateTime?
  medresa_courses MedresaCourse[]
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt

  @@index([status])
  @@index([level])
}

/// Course activated per medresa
model MedresaCourse {
  id                  String             @id @default(uuid())
  medresa_id          String
  course_id           String
  status              Status             @default(ACTIVE)
  activated_at        DateTime           @default(now())
  deleted_at          DateTime?
  medresa             Medresa            @relation(fields: [medresa_id], references: [id])
  course              Course             @relation(fields: [course_id], references: [id])
  assignments         CourseAssignment[]
  student_courses     StudentCourse[]
  attendance_sessions AttendanceSession[]
  grades              Grade[]
  created_at          DateTime           @default(now())
  updated_at          DateTime           @updatedAt

  @@unique([medresa_id, course_id])
  @@index([medresa_id])
  @@index([status])
}

/// Teacher assigned to a course within a medresa
model CourseAssignment {
  id                String        @id @default(uuid())
  medresa_course_id String
  teacher_id        String
  assigned_since    DateTime      @default(now())
  deleted_at        DateTime?
  medresa_course    MedresaCourse @relation(fields: [medresa_course_id], references: [id])
  teacher           Teacher       @relation(fields: [teacher_id], references: [id])
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@unique([medresa_course_id, teacher_id])
  @@index([teacher_id])
  @@index([medresa_course_id])
}

// ── M05: STUDENT ────────────────────────────────

/// Student — belongs to one medresa at a time
model Student {
  id                 String          @id @default(uuid())
  full_name          String
  date_of_birth      DateTime
  gender             Gender
  address            String
  guardian_name      String
  guardian_phone     String
  photo_url          String?
  current_medresa_id String
  status             StudentStatus   @default(ACTIVE)
  enrolled_at        DateTime        @default(now())
  deleted_at         DateTime?
  current_medresa    Medresa         @relation(fields: [current_medresa_id], references: [id])
  student_courses    StudentCourse[]
  transfers          StudentTransfer[]
  attendance_records AttendanceRecord[]
  grades             Grade[]
  fee_payments       FeePayment[]
  fee_balances       FeeBalance[]
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  @@index([current_medresa_id])
  @@index([status])
}

model StudentCourse {
  id                String        @id @default(uuid())
  student_id        String
  medresa_course_id String
  enrolled_at       DateTime      @default(now())
  deleted_at        DateTime?
  student           Student       @relation(fields: [student_id], references: [id])
  medresa_course    MedresaCourse @relation(fields: [medresa_course_id], references: [id])
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@unique([student_id, medresa_course_id])
  @@index([student_id])
  @@index([medresa_course_id])
}

/// Full transfer history — never deleted
model StudentTransfer {
  id              String   @id @default(uuid())
  student_id      String
  from_medresa_id String
  to_medresa_id   String
  transfer_date   DateTime
  reason          String?
  student         Student  @relation(fields: [student_id], references: [id])
  created_at      DateTime @default(now())

  @@index([student_id])
  @@index([from_medresa_id])
  @@index([to_medresa_id])
}

// ── M06: ATTENDANCE ─────────────────────────────

/// One attendance session per course per day
model AttendanceSession {
  id                String            @id @default(uuid())
  medresa_course_id String
  teacher_id        String
  date              DateTime          @db.Date
  submitted_at      DateTime?
  is_locked         Boolean           @default(false)
  deleted_at        DateTime?
  medresa_course    MedresaCourse     @relation(fields: [medresa_course_id], references: [id])
  teacher           Teacher           @relation(fields: [teacher_id], references: [id])
  records           AttendanceRecord[]
  created_at        DateTime          @default(now())
  updated_at        DateTime          @updatedAt

  @@unique([medresa_course_id, date])
  @@index([date])
  @@index([teacher_id])
  @@index([is_locked])
}

model AttendanceRecord {
  id         String            @id @default(uuid())
  session_id String
  student_id String
  status     AttendanceStatus
  note       String?
  edited_at  DateTime?
  deleted_at DateTime?
  session    AttendanceSession @relation(fields: [session_id], references: [id])
  student    Student           @relation(fields: [student_id], references: [id])
  created_at DateTime          @default(now())
  updated_at DateTime          @updatedAt

  @@unique([session_id, student_id])
  @@index([student_id])
  @@index([status])
}

// ── M07: GRADES ─────────────────────────────────

/// Exam types defined network-wide by Super Admin
model ExamType {
  id         String   @id @default(uuid())
  /// { "en": "Midterm Exam", "am": "...", "ar": "..." }
  name       Json
  max_score  Int
  weight     Int      // percentage, all active weights sum to 100
  status     Status   @default(ACTIVE)
  deleted_at DateTime?
  grades     Grade[]
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([status])
}

model Grade {
  id                String           @id @default(uuid())
  student_id        String
  medresa_course_id String
  exam_type_id      String
  teacher_id        String
  numeric_score     Int
  letter_grade      LetterGrade
  submitted_at      DateTime         @default(now())
  deleted_at        DateTime?
  student           Student          @relation(fields: [student_id], references: [id])
  medresa_course    MedresaCourse    @relation(fields: [medresa_course_id], references: [id])
  exam_type         ExamType         @relation(fields: [exam_type_id], references: [id])
  teacher           Teacher          @relation(fields: [teacher_id], references: [id])
  edit_requests     GradeEditRequest[]
  created_at        DateTime         @default(now())
  updated_at        DateTime         @updatedAt

  @@unique([student_id, medresa_course_id, exam_type_id])
  @@index([student_id])
  @@index([medresa_course_id])
  @@index([teacher_id])
}

/// Grade edit request — requires admin approval
model GradeEditRequest {
  id               String         @id @default(uuid())
  grade_id         String
  requested_by     String
  current_score    Int
  requested_score  Int
  reason           String
  status           ApprovalStatus @default(PENDING)
  reviewed_by      String?
  reviewed_at      DateTime?
  rejection_reason String?
  deleted_at       DateTime?
  grade            Grade          @relation(fields: [grade_id], references: [id])
  teacher          Teacher        @relation(fields: [requested_by], references: [id])
  created_at       DateTime       @default(now())
  updated_at       DateTime       @updatedAt

  @@index([grade_id])
  @@index([status])
}

// ── M08: FEE ────────────────────────────────────

/// Network-wide fee structure — versioned, never deleted
model FeeStructure {
  id             String       @id @default(uuid())
  monthly_amount Int          // in Ethiopian cents
  effective_from DateTime
  status         Status       @default(ACTIVE)
  created_by     String
  deleted_at     DateTime?
  fee_payments   FeePayment[]
  created_at     DateTime     @default(now())
  updated_at     DateTime     @updatedAt

  @@index([status])
  @@index([effective_from])
}

model FeePayment {
  id               String        @id @default(uuid())
  student_id       String
  medresa_id       String
  fee_structure_id String
  month            Int
  year             Int
  amount_due       Int           // in Ethiopian cents
  amount_paid      Int           // in Ethiopian cents
  payment_method   PaymentMethod
  bank_reference   String?
  payment_date     DateTime
  note             String?
  recorded_by      String
  deleted_at       DateTime?
  student          Student       @relation(fields: [student_id], references: [id])
  medresa          Medresa       @relation(fields: [medresa_id], references: [id])
  fee_structure    FeeStructure  @relation(fields: [fee_structure_id], references: [id])
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  @@index([student_id])
  @@index([medresa_id])
  @@index([month, year])
  @@index([payment_date])
}

model FeeBalance {
  id                  String   @id @default(uuid())
  student_id          String
  medresa_id          String
  total_due           Int      // in Ethiopian cents
  total_paid          Int      // in Ethiopian cents
  outstanding_balance Int      // in Ethiopian cents
  student             Student  @relation(fields: [student_id], references: [id])
  medresa             Medresa  @relation(fields: [medresa_id], references: [id])
  updated_at          DateTime @updatedAt

  @@unique([student_id, medresa_id])
  @@index([medresa_id])
  @@index([outstanding_balance])
}

// ── M09: SALARY ─────────────────────────────────

/// Salary rank levels — versioned, never deleted
model SalaryRank {
  id              String        @id @default(uuid())
  /// { "en": "Senior Teacher", "am": "...", "ar": "..." }
  name            Json
  monthly_amount  Int           // in Ethiopian cents
  effective_from  DateTime
  status          Status        @default(ACTIVE)
  deleted_at      DateTime?
  teacher_ranks   TeacherRank[]
  salary_payments SalaryPayment[]
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt

  @@index([status])
}

/// Teacher rank assignment — versioned history
model TeacherRank {
  id             String     @id @default(uuid())
  teacher_id     String
  salary_rank_id String
  effective_from DateTime
  deleted_at     DateTime?
  teacher        Teacher    @relation(fields: [teacher_id], references: [id])
  salary_rank    SalaryRank @relation(fields: [salary_rank_id], references: [id])
  created_at     DateTime   @default(now())
  updated_at     DateTime   @updatedAt

  @@index([teacher_id])
  @@index([effective_from])
}

model SalaryPayment {
  id                String     @id @default(uuid())
  teacher_id        String
  salary_rank_id    String
  month             Int
  year              Int
  amount_paid       Int        // in Ethiopian cents
  bank_reference    String
  payment_date      DateTime
  note              String?
  is_adjusted       Boolean    @default(false)
  adjustment_reason String?
  recorded_by       String
  deleted_at        DateTime?
  teacher           Teacher    @relation(fields: [teacher_id], references: [id])
  salary_rank       SalaryRank @relation(fields: [salary_rank_id], references: [id])
  created_at        DateTime   @default(now())
  updated_at        DateTime   @updatedAt

  @@unique([teacher_id, month, year])
  @@index([teacher_id])
  @@index([month, year])
  @@index([payment_date])
}

// ── AUDIT LOG ───────────────────────────────────

/// Append-only audit trail — written by DB triggers
/// No UPDATE or DELETE permitted on this table
model AuditLog {
  id           String      @id @default(uuid())
  table_name   String
  record_id    String
  action       AuditAction
  old_values   Json?
  new_values   Json?
  performed_by String?
  ip_address   String?
  performed_at DateTime    @default(now())
  user         User?       @relation(fields: [performed_by], references: [id])

  @@index([table_name])
  @@index([record_id])
  @@index([performed_by])
  @@index([performed_at])
  @@index([action])
}
```

### Performance Strategy

#### Indexing

| Pattern | Index |
|---------|-------|
| Most list queries | `(medresa_id, status)` composite |
| Fee queries | `(student_id, month, year)` composite |
| Salary queries | `(teacher_id, month, year)` composite |
| Attendance queries | `(medresa_course_id, date)` composite |
| Soft delete | Partial index `WHERE deleted_at IS NULL` on all critical tables |

#### Query Optimization

- TanStack Query: stale-while-revalidate caching
- Cursor-based pagination on all list endpoints
- Select only needed fields (no SELECT *)
- Dashboard aggregates pre-computed via materialized views refreshed nightly

#### Connection Pooling

- PgBouncer in transaction mode on VPS
- Max 20 connections to PostgreSQL
- Prisma connection limit configured per environment

#### Client-Side Caching (TanStack Query stale times)

| Data | Stale Time |
|------|-----------|
| Exam types, fee structure, salary ranks | 1 hour (node-cache) |
| Dashboard data | 5 minutes |
| Student lists | 2 minutes |
| Attendance | 30 seconds |

### API Standards

#### Versioning

- All routes prefixed: `/api/v1/`
- Breaking changes → `/api/v2/` (v1 maintained 6 months minimum)
- Version in response header: `X-API-Version: 1.0`

#### Response Format

```json
// Success
{
  "success": true,
  "data": { },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "cursor": "..."
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [ ]
  }
}
```

#### Standardized Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Valid token, wrong role |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Zod validation failed |
| `CONFLICT` | 409 | Unique constraint violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

#### HTTP Method Conventions

| Method | Use |
|--------|-----|
| GET | Read (list or single) |
| POST | Create |
| PATCH | Partial update |
| DELETE | Soft delete (sets `deleted_at`) |

> **Never use DELETE for hard delete.**

### Documentation Standards

#### Inline (Prisma Schema)
- Every model has a `///` doc comment
- Every non-obvious field has a `//` comment
- All JSONB fields document expected structure

#### Markdown Docs Structure

```
docs/
├── 01-user-auth.md
├── 02-medresa.md
├── 03-teacher.md
├── 04-course.md
├── 05-student.md
├── 06-attendance.md
├── 07-grades.md
├── 08-fees.md
├── 09-salary.md
├── 10-reporting.md
├── architecture.md
├── security.md
├── database.md
└── api-standards.md
```

Each module doc contains: purpose & scope, actors & permissions, all API endpoints with request/response examples, business rules, data model diagram, and edge cases.

### Future-Proofing

#### What Is Ready for Expansion

| Feature | How It's Ready |
|---------|---------------|
| Multi-language | JSONB fields — add new language without schema migration |
| API versioning | Add v2 routes without breaking v1 |
| Audit compliance | Full audit log foundation already in place |
| Data recovery | Soft delete — full recovery always possible |
| Network growth | UUID PKs — safe to merge data from multiple instances |
| New modules | Modular folder structure — add without touching existing code |

#### Potential Future Modules

| Module | Description |
|--------|-------------|
| M11 | Parent Portal — view child's attendance and grades |
| M12 | SMS Notifications — fee reminders, results via SMS |
| M13 | Academic Year Management |
| M14 | Library Management |
| M15 | Timetable / Schedule Management |

---

## AI Build Prompts Reference

This section contains all AI prompts in build order. Copy each prompt into your AI agent when building the corresponding module.

### Master System Context Prompt

```
You are building the Sefinet Al Neja,
a web + PWA platform for 20+ Islamic schools in Harari, Ethiopia.

TECH STACK:
Frontend: React (Vite) + TypeScript, TanStack Router, TanStack Query,
          Shadcn/ui + Tailwind CSS, React Hook Form + Zod,
          Recharts, jsPDF, SheetJS, Vite PWA Plugin,
          i18next (Amharic/English/Arabic RTL), ethiopian-date, Axios

Backend: Node.js + Express.js + TypeScript, JWT (access 15min +
         refresh 7days httpOnly), Nodemailer, Multer, Zod,
         Prisma + PostgreSQL, node-cron

Security: helmet, CORS whitelist, rate-limit 100req/min,
          JWT middleware, Role Guard, Medresa Scope Guard,
          PostgreSQL RLS, bcrypt salt 12, UUID PKs

ROLES:
- super_admin: full network access
- medresa_admin: own medresa only (students & fees, NOT teachers)
- teacher: own courses only (attendance & grades)
- Teacher role stored per medresa in TeacherMedresa table
- A teacher can be admin in multiple medresas simultaneously

CONVENTIONS:
- UUID primary keys
- Soft delete (deleted_at) on all critical tables
- Multilingual JSONB: { "en": "...", "am": "...", "ar": "..." }
- Monetary amounts as Integer (Ethiopian cents)
- Ethiopian calendar display, Gregorian storage
- API prefix: /api/v1/
- Standard response: { success, data, meta } / { success, error }
```

### M01 — User & Role Management

```
Build M01: User & Role Management.

SCOPE:
1. LOGIN: phone or email + password. Redirect by role on success.
2. FORGOT PASSWORD: email reset link, expires 1 hour, single use.
3. USER MANAGEMENT (Super Admin only):
   - List all users (filters: medresa, role, status)
   - Create user (auto-generate password, send reset email)
   - Edit user details
   - Deactivate / reactivate (preserves all historical data)

BUSINESS RULES:
- Only Super Admin creates/edits/deactivates accounts
- Deactivated accounts lose access immediately
- Historical records never deleted
- Super Admin cannot be deactivated
- No user enumeration on forgot password screen

DELIVERABLES: auth module, user CRUD, JWT middleware,
role guard middleware, password reset flow
```

### M02 — Medresa Management

```
Build M02: Medresa Management.

SCOPE:
1. List all medresas (filters: status, location)
2. Create / edit medresa (name required unique, location required, phone optional)
3. Medresa detail (info + teacher list + student count + course count)
4. Deactivate / reactivate (hides from network, preserves all data)

BUSINESS RULES:
- Super Admin only
- Name unique network-wide
- Deactivation hides from all non-super-admin views
- Fee structure is global — not stored here (M08)

DELIVERABLES: medresa CRUD screens, API endpoints
```

### M03 — Teacher Management

```
Build M03: Teacher Management.

SCOPE:
1. Teacher list (photo, name, phone, email, specialization,
   date joined, assigned medresas, status)
2. Create / edit teacher (auto-create User account, send reset email)
3. Teacher detail (profile + medresa assignment table)
4. Assign to medresa: single or bulk, role per medresa
5. Teacher own profile (read only)

BUSINESS RULES:
- Super Admin manages all teachers
- Teacher is network-level (not per medresa)
- Role fully flexible per medresa — can be admin in multiple
- Removing from medresa preserves historical data
- Photo: jpg/png max 2MB

DELIVERABLES: teacher CRUD, medresa assignment (single + bulk),
photo upload, TeacherMedresa join table management
```

### M04 — Course Management

```
Build M04: Course Management.

SCOPE:
1. Master course list — Super Admin creates (name JSON, description JSON, level)
2. Medresa course list — Admin activates from master list
3. Assign teacher to course (one per course per medresa)
4. Course detail (info + teacher + enrolled students)

BUSINESS RULES:
- Super Admin manages master list
- Course must be activated before use in a medresa
- Teacher must be assigned to medresa before course assignment
- Deactivating master course preserves history

DELIVERABLES: course CRUD, activation per medresa,
teacher-course assignment
```

### M05 — Student Management

```
Build M05: Student Management.

SCOPE:
1. Student list per medresa (filters: gender, course, status)
2. Enroll / edit student (name, DOB, gender, address,
   guardian name & phone, photo optional)
3. Student detail (profile + courses + transfer history)
4. Assign student to specific courses
5. Transfer student to another medresa
6. Teacher view: own course students only (read only)

BUSINESS RULES:
- Medresa Admin manages students (NOT teachers)
- One medresa at a time — transfer history kept
- After transfer, destination admin re-assigns courses
- Students only assignable to active courses with assigned teacher

DELIVERABLES: student CRUD, course assignment,
transfer flow with history, photo upload
```

### M06 — Attendance Tracking

```
Build M06: Attendance Tracking.

SCOPE:
1. Take attendance (default Absent, mark Present/Absent/Late/Excused)
2. Edit attendance (same day only, log edit timestamp)
3. Attendance history per course (read only after lock)
4. Student attendance detail + percentage
5. Medresa overview (by course/teacher)
6. Network overview (Super Admin)

BUSINESS RULES:
- Once per day per student (not per session)
- Default: Absent
- Editable same day only — locked after midnight (cron job)
- Teacher sees own course students only
- Medresa Admin + Super Admin: view only

DELIVERABLES: attendance UI, session locking cron job,
attendance overview by role
```

### M07 — Grades & Results

```
Build M07: Grades & Results.

SCOPE:
1. Exam type management — Super Admin (name JSON, max score, weight %)
2. Grade entry — Teacher (numeric score → auto letter grade)
   90-100→A, 80-89→B, 70-79→C, 60-69→D, below 60→F
3. Grade edit request — Teacher (reason required, pending approval)
4. Grade edit approval — Medresa Admin / Super Admin
5. Student results (weighted totals, GPA)
6. Class results + PDF export
7. Medresa and network overviews

BUSINESS RULES:
- Active exam type weights must sum to 100%
- Grade unchanged until approved
- All edit requests and approvals logged

DELIVERABLES: exam type CRUD, grade entry, edit request/approval flow,
results screens, PDF export
```

### M08 — Fee Management

```
Build M08: Fee Management.

SCOPE:
1. Fee structure — Super Admin (one flat monthly amount, versioned)
2. Fee collection list — Medresa Admin (Paid/Partial/Unpaid)
3. Record payment (cash or bank transfer, partial allowed,
   bank reference required for transfers)
4. Student fee history + PDF export
5. Medresa fee overview
6. Network fee overview — Super Admin

BUSINESS RULES:
- One flat monthly fee for all students network-wide
- Partial payments allowed — balance carries forward
- Medresa Admin cannot edit/delete payments
- Teachers have zero access

DELIVERABLES: fee structure versioning, payment recording,
balance tracking, PDF export
```

### M09 — Salary Management

```
Build M09: Salary Management.

SCOPE:
1. Salary rank management (name JSON, monthly amount, versioned)
2. Assign rank to teacher (one rank network-wide, changes versioned)
3. Salary payment list (flag unpaid teachers each month)
4. Record salary payment (bank transfer only, reference required,
   amount auto-filled, adjustments logged)
5. Teacher salary history + PDF export
6. Network salary overview + PDF export

BUSINESS RULES:
- Super Admin EXCLUSIVE — zero access for any other role
- One rank per teacher at a time
- One payment per teacher per month
- Bank reference mandatory
- Unpaid teachers flagged automatically (monthly cron)

DELIVERABLES: rank CRUD, teacher rank assignment, payment recording,
monthly unpaid flagging cron, PDF exports, strict role middleware
```

### M10 — Reporting & Dashboard

```
Build M10: Reporting & Dashboard.

SCOPE:
1. Teacher dashboard (cards + charts + quick actions)
2. Medresa Admin dashboard (cards + charts + quick actions)
3. Super Admin dashboard (cards + charts + quick actions)
4. Exportable reports (PDF + Excel):
   R01. Student Enrollment
   R02. Attendance
   R03. Fee Collection
   R04. Salary (Super Admin only)
   R05. Grades & Results

BUSINESS RULES:
- All dates displayed in Ethiopian calendar
- Role-scoped: teachers see own data, admins see medresa,
  super admin sees network
- Salary reports Super Admin only
- All exports timestamped in Ethiopian calendar

DELIVERABLES: 3 role dashboards, 5 exportable reports,
Ethiopian date conversion utility, chart components
```

### Phase 6 — Database, Security & Standards Setup

```
Set up the complete foundation for HMMS:

TASK 1 — PRISMA SCHEMA:
Generate complete schema.prisma with all 23 models,
UUID PKs, soft delete, JSONB multilingual fields,
monetary amounts as Int (cents), all indexes.

TASK 2 — POSTGRESQL RLS:
- Create roles: sefinet_app (limited), sefinet_admin (migrations)
- Enable RLS on all tables
- Write medresa_id isolation policies
- AuditLog: INSERT only

TASK 3 — EXPRESS MIDDLEWARE:
helmet → cors → rate-limit → JWT verify →
role guard → medresa scope guard → zod validator

TASK 4 — AUTH MODULE:
- Login (phone or email + bcrypt 12)
- JWT access (15min) + refresh (7days, httpOnly, hashed)
- Refresh token rotation
- Password reset (email, 1hr, hashed, single use)

TASK 5 — CRON JOBS:
- Midnight: lock attendance sessions
- Monthly 1st: flag unpaid salaries

TASK 6 — STANDARDS:
- Response formatter (success/error)
- Error codes enum
- API versioning setup

TASK 7 — DOCS:
Generate docs/architecture.md, security.md,
database.md, api-standards.md

DELIVERABLES: schema.prisma, middleware/, auth module,
cron jobs, response utils, RLS SQL, docker-compose.yml, docs/
```

---

*End of HMMS Master Project Specification v1.0*
*Generated: May 2026 | Harari, Ethiopia*

