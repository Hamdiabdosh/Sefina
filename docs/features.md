━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 1: Idea Investigation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT NAME: Harari Medresa Management System (HMMS)
TYPE: Multi-tenant Web Management System
REGION: Harari, Ethiopia

PROBLEM STATEMENT:
The Harari medresa network (20+ schools) operates in full isolation.
Student records are scattered and frequently lost. Fee collection is
informal and inconsistent. Teacher salaries are uncoordinated across
schools. No authority has a unified view of the network's health,
enrollment, or finances.

VISION:
A centralized, multi-tenant platform where each medresa manages its
own students, teachers, fees, and salaries — while a super-admin
monitors the entire network from one dashboard.

CORE PAIN POINTS:
1. Student records scattered / lost across medresas
2. Fee collection untracked and inconsistent
3. Teacher salaries hard to manage across schools
4. No central network-wide visibility

ACCESS MODEL:
- Medresa Admin → sees & manages only their own medresa
- Super Admin → full read/write access across all 20+ medresas

LANGUAGE SUPPORT:
- Amharic (primary local language)
- English (administrative/technical)
- Arabic (Islamic education context)

SUCCESS LOOKS LIKE:
- Every medresa has a digital record of all students & teachers
- Fee payments are logged and trackable per student
- Salaries are calculated and recorded per teacher per medresa
- Super-admin can pull network-wide reports at any time


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 2: System Understanding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM: Harari Medresa Management System (HMMS)
ACTOR MODEL: 3-tier role system (role is context-aware per medresa)

━━━ ACTORS & PERMISSIONS ━━━

1. SUPER ADMIN (1 global account)
   - Full access across all 20+ medresas
   - Create / edit / deactivate medresas
   - Create teacher accounts (network-level)
   - Assign / remove medresa admin role to any teacher
   - Manage salary: set scales, process & record payments
   - Set fee structures per medresa
   - Generate network-wide reports (enrollment, fees, salaries)
   - View all data across all medresas

2. MEDRESA ADMIN (a teacher elevated per medresa)
   - A teacher can be admin in one medresa and regular teacher in another
   - Inherits all regular teacher permissions within their medresa
   - Add / remove students in their medresa
   - Assign teachers to their medresa (from network teacher pool)
   - Record & track student fee payments
   - Generate medresa-level reports
   - CANNOT manage salaries (Super Admin only)

3. TEACHER (base role, network-level entity)
   - Belongs to the network, can be assigned to 1 or more medresas
   - View own profile & assignments across medresas
   - View their class roster & student profiles
   - Record student attendance (per class, per medresa)
   - Enter student grades / results
   - CANNOT access fee or salary data

━━━ KEY ARCHITECTURAL NOTES ━━━

MULTI-MEDRESA TEACHER:
  - Teacher is a network-level entity (not owned by one medresa)
  - teacher_medresa join table tracks which medresas a teacher belongs to
  - A teacher's role (teacher vs admin) is scoped per medresa
  - Example: Ustaz Ahmed = Admin at Medresa A, Teacher at Medresa B

SALARY OWNERSHIP:
  - Salary module is Super Admin only
  - Medresa Admins have zero visibility into salary data

ACCESS MODEL SUMMARY:
  Role         | Own Medresa | Other Medresas | Network-wide
  -------------|-------------|----------------|-------------
  Teacher      | Own data    | None           | None
  Medresa Admin| Full*       | None           | None
  Super Admin  | Full        | Full           | Full
  (*except salary)


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 3: Module Decomposition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM: Harari Medresa Management System (HMMS)
TOTAL MODULES: 10
BUILD ORDER: Foundation → Core → Operational → Insights

━━━ BUILD ORDER & MODULE SUMMARY ━━━

TIER 1 — FOUNDATION (build first, everything depends on these)
  M01. User & Role Management
       Owner: Super Admin
       Purpose: Accounts, login, role assignment per medresa
       Key entities: User, Role, MedresaRole (join)

  M02. Medresa Management
       Owner: Super Admin
       Purpose: Create/edit/deactivate medresas in the network
       Key entities: Medresa, MedresaSettings

  M03. Teacher Management
       Owner: Super Admin
       Purpose: Create teacher accounts, assign to medresas,
                elevate to medresa admin role
       Key entities: Teacher, TeacherMedresa (join)

TIER 2 — CORE (depends on Tier 1)
  M04. Course Management
       Owner: Super Admin (create), Medresa Admin (assign)
       Purpose: Define courses per medresa, assign teachers to courses
       Key entities: Course, CourseAssignment

  M05. Student Management
       Owner: Medresa Admin
       Purpose: Enroll/remove students, assign to courses,
                manage student profiles
       Key entities: Student, StudentMedresa, StudentCourse

TIER 3 — OPERATIONAL (depends on Tier 2)
  M06. Attendance Tracking
       Owner: Teacher
       Purpose: Record daily attendance per class/course
       Key entities: AttendanceRecord, AttendanceSession

  M07. Grades & Results
       Owner: Teacher
       Purpose: Enter exam/assignment grades per student per course
       Key entities: Grade, ExamType, Result

  M08. Fee Management
       Owner: Medresa Admin
       Purpose: Define fee types, record payments per student,
                track outstanding balances
       Key entities: FeeStructure, FeePayment, FeeBalance

  M09. Salary Management
       Owner: Super Admin ONLY
       Purpose: Set salary scales per teacher per medresa,
                record monthly salary payments
       Key entities: SalaryScale, SalaryPayment

TIER 4 — INSIGHTS (depends on all above)
  M10. Reporting & Dashboard
       Owner: All roles (scoped by role)
       Purpose:
         - Teacher: own attendance & grade summaries
         - Medresa Admin: enrollment, fees, student reports
         - Super Admin: network-wide enrollment, finance,
                        salary & fee overview across all medresas
       Key entities: (reads from all modules, no new tables)

━━━ MODULE DEPENDENCY MAP ━━━

  M01 → M02 → M03 → M04 → M05 → M06
                              ↘ M07
                         M08 ↗
                    M09 ↗
                         → M10

━━━ PERMISSION MATRIX (updated) ━━━

  Module              | Super Admin | Medresa Admin | Teacher
  --------------------|-------------|---------------|--------
  User & Role Mgmt    | Full        | None          | None
  Medresa Mgmt        | Full        | View own      | None
  Teacher Mgmt        | Full        | None          | Own profile
  Course Mgmt         | Full        | Assign only   | View own
  Student Mgmt        | Full        | Full          | View own class
  Attendance          | View        | View          | Full
  Grades & Results    | View        | View          | Full
  Fee Management      | Full        | Full          | None
  Salary Management   | Full        | None          | None
  Reporting           | Network     | Own medresa   | Own data


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M01: User & Role Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M01 — User & Role Management
OWNER: Super Admin
DEPENDS ON: Nothing (foundation module)

━━━ SCREENS ━━━

1. LOGIN SCREEN
   Fields: Phone or Email, Password
   Actions: Login, Forgot Password
   Validations:
     - Phone: Ethiopian format (09XXXXXXXX or +2519XXXXXXXX)
     - Email: standard email format
     - Password: min 8 characters
   On success: redirect based on role
     - Super Admin → network dashboard
     - Medresa Admin → their medresa dashboard
     - Teacher → their classes dashboard

2. FORGOT PASSWORD SCREEN
   Fields: Email address
   Actions: Send Reset Link
   Behavior:
     - System sends a time-limited reset link (expires in 1 hour)
     - If email not found, show generic message (no user enumeration)
     - Reset link leads to Set New Password screen

3. SET NEW PASSWORD SCREEN
   Fields: New Password, Confirm Password
   Validations: min 8 chars, must match
   On success: redirect to login

4. USER LIST SCREEN (Super Admin only)
   Displays: All teacher accounts across the network
   Columns: Full Name, Phone, Email, Assigned Medresas,
            Role per Medresa, Status (Active/Inactive)
   Actions: Create User, Edit User, Deactivate User
   Filters: By medresa, by role, by status

5. CREATE / EDIT USER SCREEN (Super Admin only)
   Fields:
     - Full Name (required)
     - Phone Number (required, Ethiopian format)
     - Email (required, for password reset)
     - Password (auto-generated on create, user resets via email)
     - Status: Active / Inactive
   Note: Role assignment is done inside Teacher Management (M03),
         not here — keeps concerns separated

6. DEACTIVATE USER DIALOG
   Trigger: Super Admin clicks Deactivate on a user
   Behavior:
     - Confirmation dialog: "Deactivate [Name]? They will lose
       all system access immediately."
     - On confirm: account status → Inactive, session invalidated
     - All historical records (attendance, grades) are preserved
     - Deactivated user cannot log in
     - Super Admin can reactivate at any time

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can create, edit, or deactivate accounts
BR-02: A deactivated account loses access immediately
BR-03: Historical data of deactivated teachers is never deleted
BR-04: Password reset only works via email (no phone SMS)
BR-05: Reset links expire after 1 hour
BR-06: Super Admin account cannot be deactivated
BR-07: Login identifier can be phone OR email interchangeably

━━━ DATA ENTITIES ━━━

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

Note: Role per medresa is stored in TeacherMedresa (M03)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M02: Medresa Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M02 — Medresa Management
OWNER: Super Admin
DEPENDS ON: M01 (User & Role Management)

━━━ SCREENS ━━━

1. MEDRESA LIST SCREEN (Super Admin only)
   Displays: All medresas in the network
   Columns: Name, Location, Phone, Total Students,
            Total Teachers, Status (Active/Inactive)
   Actions: Create Medresa, Edit Medresa, Deactivate Medresa
   Filters: By status (Active/Inactive), by location

2. CREATE / EDIT MEDRESA SCREEN (Super Admin only)
   Fields:
     - Medresa Name (required)
     - Location / Area in Harari (required)
     - Phone Number (optional)
   On save: medresa appears in network, ready for
            teacher & student assignment

3. MEDRESA DETAIL SCREEN (Super Admin only)
   Displays:
     - Medresa info (name, location, phone)
     - Assigned teachers list (with their roles)
     - Enrolled students count
     - Active courses count
     - Status (Active / Inactive)
   Actions: Edit, Deactivate, View Teachers, View Students

4. DEACTIVATE MEDRESA DIALOG
   Trigger: Super Admin clicks Deactivate
   Behavior:
     - Confirmation dialog: "Deactivate [Medresa Name]?
       It will be hidden from the network."
     - On confirm: status → Inactive
     - All data (students, teachers, fees, grades) preserved
     - Medresa Admins & teachers of that medresa lose
       access to it immediately
     - Super Admin can reactivate at any time

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can create, edit, or deactivate medresas
BR-02: Medresa name must be unique across the network
BR-03: Deactivating a medresa does NOT delete any data
BR-04: Deactivated medresas are hidden from all non-super-admin views
BR-05: A medresa must exist before teachers or students can be assigned
BR-06: Phone number is optional but must be valid if provided
BR-07: Fee structure is network-wide — not stored per medresa
        (managed in M08: Fee Management)

━━━ DATA ENTITIES ━━━

Medresa {
  id, name, location, phone (nullable),
  status (active/inactive),
  created_at, updated_at
}

Note: Teacher-Medresa relationships stored in M03 (TeacherMedresa)
Note: Student-Medresa relationships stored in M05 (StudentMedresa)
Note: Fee structure is global, not per medresa (M08)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M03: Teacher Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M03 — Teacher Management
OWNER: Super Admin
DEPENDS ON: M01 (User & Role Management), M02 (Medresa Management)

━━━ SCREENS ━━━

1. TEACHER LIST SCREEN (Super Admin only)
   Displays: All teachers in the network
   Columns: Photo, Full Name, Phone, Email, Specialization,
            Date Joined, Assigned Medresas, Status
   Actions: Create Teacher, Edit Teacher, Deactivate Teacher,
            Assign to Medresa
   Filters: By medresa, by status, by specialization

2. CREATE / EDIT TEACHER SCREEN (Super Admin only)
   Fields:
     - Full Name (required)
     - Phone Number (required, Ethiopian format)
     - Email (required, used for password reset)
     - Subject Specialization (required, e.g. Quran, Fiqh, Arabic)
     - Date Joined (required)
     - Photo (optional, image upload)
     - Status: Active / Inactive
   On create: system auto-creates a User account (M01)
              and sends password reset email to teacher

3. TEACHER DETAIL SCREEN (Super Admin only)
   Displays:
     - Full profile (name, photo, phone, email,
       specialization, date joined)
     - Medresa assignments table:
       Medresa Name | Role (Admin / Teacher) | Assigned Since
     - Status (Active / Inactive)
   Actions: Edit Profile, Assign to Medresa,
            Change Role per Medresa, Remove from Medresa

4. ASSIGN TO MEDRESA SCREEN (Super Admin only)
   Mode 1 — Single assignment:
     - Select medresa from dropdown
     - Select role: Teacher or Admin
     - Set assignment date
   Mode 2 — Bulk assignment:
     - Select multiple medresas
     - Set role per medresa individually
     - Confirm all assignments at once

5. TEACHER PROFILE SCREEN (Teacher — own profile only)
   Displays: Own photo, name, phone, email,
             specialization, date joined
   Displays: List of medresas they are assigned to
             and their role in each
   Actions: None (read-only, edits done by Super Admin)

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can create, edit, assign,
       or deactivate teachers
BR-02: Creating a teacher automatically creates
       a linked User account (M01)
BR-03: A teacher can be assigned to any number of medresas
BR-04: A teacher can hold Admin role in any number
       of medresas simultaneously (fully flexible)
BR-05: A teacher can be Admin in one medresa and
       Teacher in another — role is fully per-medresa
BR-06: Removing a teacher from a medresa does not
       delete their historical data in that medresa
BR-07: Deactivating a teacher revokes access to
       all medresas immediately
BR-08: A teacher must be assigned to a medresa before
       they can be assigned to courses in that medresa (M04)
BR-09: Photo is optional but must be image format
       (jpg, png) if provided, max 2MB

━━━ DATA ENTITIES ━━━

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

Note: One teacher can have multiple TeacherMedresa rows,
      one per medresa they are assigned to

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M04: Course Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M04 — Course Management
OWNER: Super Admin (master list), Medresa Admin (activation
       & teacher assignment within their medresa)
DEPENDS ON: M01, M02, M03

━━━ SCREENS ━━━

1. MASTER COURSE LIST SCREEN (Super Admin only)
   Displays: All courses in the network master list
   Columns: Course Name, Description, Level, Used By
            (how many medresas activated it)
   Actions: Create Course, Edit Course, Deactivate Course
   Filters: By level, by status (active/inactive)

2. CREATE / EDIT COURSE SCREEN (Super Admin only)
   Fields:
     - Course Name (required, unique network-wide)
     - Description (required)
     - Level (required — Beginner / Intermediate / Advanced)
     - Status: Active / Inactive
   On save: course becomes available for all medresas to activate

3. MEDRESA COURSE LIST SCREEN (Medresa Admin)
   Displays: All courses activated for their medresa
   Columns: Course Name, Level, Assigned Teacher, Students Enrolled
   Actions: Activate Course, Deactivate Course for this medresa,
            Assign Teacher to Course
   Filters: By level, by teacher

4. ACTIVATE COURSE SCREEN (Medresa Admin)
   Displays: Full master course list (Super Admin created)
   Medresa Admin selects which courses to activate
   for their medresa
   On activate: course appears in their medresa course list
                ready for teacher assignment & student enrollment

5. ASSIGN TEACHER TO COURSE SCREEN (Medresa Admin)
   Fields:
     - Select Course (from their activated courses)
     - Select Teacher (from teachers assigned to their medresa)
   Behavior:
     - A teacher can be assigned to multiple courses
       in the same medresa
     - A teacher can teach the same course in different medresas
     - One course can have one assigned teacher per medresa
   On save: assignment is recorded for attendance &
            grade tracking (M06, M07)

6. COURSE DETAIL SCREEN (Medresa Admin & Teacher)
   Displays:
     - Course info (name, description, level)
     - Assigned teacher for this medresa
     - Enrolled students list
     - Attendance summary (once M06 is built)
     - Grade summary (once M07 is built)

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can create, edit, or deactivate
       master courses
BR-02: Course name must be unique across the network
BR-03: Medresa Admin can only activate/deactivate courses
       within their own medresa
BR-04: A course must be activated in a medresa before
       teachers or students can be assigned to it
BR-05: One teacher assigned per course per medresa
BR-06: A teacher can be assigned to multiple courses
       in the same medresa
BR-07: A teacher can teach the same or different courses
       across different medresas
BR-08: Deactivating a master course hides it from
       all medresas but preserves all historical data
BR-09: Deactivating a course within a medresa removes
       it from that medresa's active list only —
       does not affect other medresas

━━━ DATA ENTITIES ━━━

Course {
  id, name, description,
  level (enum: beginner/intermediate/advanced),
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

Note: Student enrollment to courses stored in M05 (StudentCourse)



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M05: Student Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M05 — Student Management
OWNER: Medresa Admin
DEPENDS ON: M01, M02, M03, M04

━━━ SCREENS ━━━

1. STUDENT LIST SCREEN (Medresa Admin)
   Displays: All students enrolled in their medresa
   Columns: Photo, Full Name, Gender, Guardian Phone,
            Enrolled Courses, Status (Active/Transferred)
   Actions: Enroll Student, Edit Student, Transfer Student,
            Assign to Course
   Filters: By gender, by course, by status

2. ENROLL STUDENT SCREEN (Medresa Admin)
   Fields:
     - Full Name (required)
     - Date of Birth (required)
     - Gender (required — Male / Female)
     - Address (required)
     - Guardian Name (required)
     - Guardian Phone (required, Ethiopian format)
     - Photo (optional, jpg/png, max 2MB)
   On save: student is enrolled in this medresa,
            ready for course assignment

3. EDIT STUDENT SCREEN (Medresa Admin)
   Same fields as enroll screen
   Can update any student info except medresa assignment
   (that is handled via transfer)

4. STUDENT DETAIL SCREEN (Medresa Admin & Teacher)
   Displays:
     - Full profile (photo, name, DOB, gender,
       address, guardian name & phone)
     - Current medresa
     - Enrolled courses list
     - Transfer history (previous medresas)
     - Attendance summary (placeholder for M06)
     - Grades summary (placeholder for M07)
     - Fee payment status (placeholder for M08)
   Actions (Medresa Admin only):
     Edit, Transfer, Assign to Course, Remove from Course

5. ASSIGN STUDENT TO COURSE SCREEN (Medresa Admin)
   Displays: All active courses in their medresa
   Medresa Admin selects one or more courses
   to assign the student to
   Validations:
     - Course must be activated in this medresa (M04)
     - Course must have an assigned teacher (M04)
   On save: student appears in teacher's class roster

6. TRANSFER STUDENT SCREEN (Medresa Admin)
   Fields:
     - Select destination medresa (active medresas only)
     - Transfer date
     - Reason for transfer (optional, text)
   Behavior:
     - Student status in current medresa → Transferred
     - Student is enrolled in destination medresa
     - All historical data (grades, attendance, fees)
       in previous medresa is preserved and visible
       to Super Admin
     - Destination Medresa Admin must re-assign
       student to courses manually
     - Transfer history is recorded and viewable

7. STUDENT LIST SCREEN (Teacher — read only)
   Displays: Only students enrolled in their courses
   Columns: Photo, Full Name, Gender, Enrolled Course
   Actions: View Detail only
   Note: Teacher cannot edit student info

━━━ BUSINESS RULES ━━━

BR-01: Only Medresa Admin can enroll, edit, or transfer
       students within their medresa
BR-02: A student belongs to exactly one medresa at a time
BR-03: Transferring a student preserves all their
       historical data in the previous medresa
BR-04: After transfer, destination Medresa Admin must
       manually assign student to courses
BR-05: A student can only be assigned to courses
       that are active and have an assigned teacher
BR-06: Teachers can view students in their courses only
BR-07: Super Admin can view all students across
       all medresas (read only)
BR-08: Photo is optional, max 2MB, jpg/png only
BR-09: Guardian phone must be valid Ethiopian format
BR-10: Student enrollment date is auto-recorded
       on creation

━━━ DATA ENTITIES ━━━

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


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M06: Attendance Tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M06 — Attendance Tracking
OWNER: Teacher (record), Medresa Admin (view),
       Super Admin (view all)
DEPENDS ON: M01, M02, M03, M04, M05

━━━ SCREENS ━━━

1. ATTENDANCE TAKING SCREEN (Teacher)
   Displays: List of all students in their course
             for today's date
   Columns: Photo, Student Name, Status
   Status options: Present / Absent / Late / Excused
   Behavior:
     - Default status is Absent for all students
     - Teacher marks each student individually
     - Can add a note per student (optional)
     - Submit button locks the record for the day
     - If already submitted today: screen shows
       read-only view with Edit button (same day only)
   Actions: Submit Attendance, Edit (same day only)

2. EDIT ATTENDANCE SCREEN (Teacher — same day only)
   Displays: Today's submitted attendance record
   Teacher can change any student's status
   On save: updated record replaces previous,
            edit timestamp is logged
   After midnight: record is locked permanently,
                   no further edits allowed

3. ATTENDANCE HISTORY SCREEN (Teacher)
   Displays: Past attendance records for their course
   Columns: Date, Present, Absent, Late, Excused, Total
   Actions: View detail for any past date (read only)
   Filters: By date range, by student

4. STUDENT ATTENDANCE DETAIL SCREEN (Teacher)
   Displays: Full attendance history for one student
             in their course
   Columns: Date, Status, Note
   Summary: Total Present, Absent, Late, Excused counts
            Attendance percentage

5. MEDRESA ATTENDANCE OVERVIEW (Medresa Admin)
   Displays: Daily attendance summary across all
             courses in their medresa
   Columns: Course, Teacher, Present, Absent,
            Late, Excused, Total Students
   Filters: By date, by course, by teacher
   Actions: Drill down into any course's attendance

6. SUPER ADMIN ATTENDANCE OVERVIEW
   Displays: Network-wide daily attendance summary
   Columns: Medresa, Total Students, Present,
            Absent, Late, Excused
   Filters: By medresa, by date range

━━━ BUSINESS RULES ━━━

BR-01: Only teachers can record and edit attendance
BR-02: Attendance is recorded once per day per student
       (not per course session)
BR-03: Default status for all students is Absent
       until teacher marks them
BR-04: Teacher can only edit attendance on the same
       calendar day it was submitted
BR-05: After midnight, attendance is permanently locked
BR-06: Edit timestamp is logged when attendance is corrected
BR-07: A teacher can only take attendance for students
       in their assigned courses
BR-08: Attendance cannot be taken for future dates
BR-09: Medresa Admin can view but NOT edit attendance
BR-10: Super Admin can view all attendance network-wide
       but cannot edit

━━━ DATA ENTITIES ━━━

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
  status (enum: present/absent/late/excused),
  note (nullable),
  edited_at (nullable),
  created_at, updated_at
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M07: Grades & Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M07 — Grades & Results
OWNER: Teacher (record & edit request), Medresa Admin
       (approve edits & view), Super Admin (manage exam
       types, approve edits & view all)
DEPENDS ON: M01, M02, M03, M04, M05

━━━ SCREENS ━━━

1. EXAM TYPE MANAGEMENT SCREEN (Super Admin only)
   Displays: All exam types defined network-wide
   Columns: Exam Type Name, Max Score, Weight (%),
            Status (Active/Inactive)
   Actions: Create Exam Type, Edit, Deactivate
   Examples: Midterm, Final Exam, Assignment, Quiz,
             Oral Exam, Hifz Test
   Note: Weights across all active exam types
         must sum to 100%

2. GRADE ENTRY SCREEN (Teacher)
   Displays: All students in their course
   Columns: Photo, Student Name, Exam Type,
            Numeric Score, Letter Grade
   Behavior:
     - Teacher selects exam type first
     - Enters numeric score per student (0 to max score)
     - Letter grade auto-calculated from numeric score:
         90-100 → A, 80-89 → B, 70-79 → C,
         60-69 → D, below 60 → F
     - Teacher submits grades for the whole class at once
   Actions: Submit Grades

3. GRADE EDIT REQUEST SCREEN (Teacher)
   Trigger: Teacher clicks Edit on a submitted grade
   Fields:
     - Student name (read only)
     - Exam type (read only)
     - Current score (read only)
     - New score (required)
     - Reason for change (required)
   On submit: edit request sent to Medresa Admin
              for approval, grade unchanged until approved

4. GRADE EDIT APPROVAL SCREEN (Medresa Admin)
   Displays: All pending grade edit requests
             for their medresa
   Columns: Teacher, Student, Course, Exam Type,
            Current Score, Requested Score, Reason
   Actions: Approve, Reject
   On approve: grade updated, teacher notified
   On reject: grade unchanged, teacher notified
              with rejection reason

5. STUDENT RESULTS SCREEN (Teacher & Medresa Admin)
   Displays: Full grade report for one student
   Columns: Course, Exam Type, Score, Letter Grade,
            Max Score, Weight
   Summary: Weighted total score per course,
            overall GPA across all courses
   Filters: By course, by exam type

6. CLASS RESULTS SCREEN (Teacher)
   Displays: All students' grades in their course
   Columns: Student Name, scores per exam type,
            weighted total, letter grade
   Actions: Export to PDF
   Filters: By exam type

7. MEDRESA RESULTS OVERVIEW (Medresa Admin)
   Displays: Grade summary across all courses
             in their medresa
   Columns: Course, Teacher, Class Average,
            Highest Score, Lowest Score
   Filters: By course, by exam type, by teacher

8. NETWORK RESULTS OVERVIEW (Super Admin)
   Displays: Grade summary across all medresas
   Columns: Medresa, Course, Class Average
   Filters: By medresa, by course, by exam type

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can create/edit exam types
BR-02: Exam type weights must sum to 100% when
       all active types are combined
BR-03: Letter grade is auto-calculated from numeric score
BR-04: Teacher can only enter grades for students
       in their assigned courses
BR-05: Grade edits require Medresa Admin approval
BR-06: Grade is unchanged until edit is approved
BR-07: All edit requests and approvals are logged
BR-08: Medresa Admin can view but NOT directly edit grades
       (must go through approval flow)
BR-09: Super Admin can approve grade edits for any medresa
BR-10: A grade cannot be entered for a student not
       enrolled in that course

━━━ DATA ENTITIES ━━━

ExamType {
  id, name, max_score, weight (%),
  status (active/inactive),
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M08: Fee Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M08 — Fee Management
OWNER: Super Admin (fee structure), Medresa Admin
       (payment recording & tracking)
DEPENDS ON: M01, M02, M03, M05

━━━ SCREENS ━━━

1. FEE STRUCTURE SCREEN (Super Admin only)
   Displays: Current network-wide monthly fee amount
   Fields:
     - Monthly Fee Amount (required, in ETB)
     - Effective From Date (required)
   Behavior:
     - Only one active fee amount at a time
     - Changing the fee creates a new record with
       effective date — old records are preserved
     - History of all past fee amounts is visible
   Actions: Set New Fee Amount, View Fee History

2. FEE COLLECTION SCREEN (Medresa Admin)
   Displays: All students in their medresa with
             current month payment status
   Columns: Photo, Student Name, Month, Amount Due,
            Amount Paid, Balance, Status (Paid/Partial/Unpaid)
   Actions: Record Payment, View Payment History
   Filters: By payment status, by month

3. RECORD PAYMENT SCREEN (Medresa Admin)
   Fields:
     - Student (read only — selected from list)
     - Month & Year (required)
     - Amount Paid (required, in ETB)
     - Payment Method (required — Cash / Bank Transfer)
     - Bank Reference Number (required if Bank Transfer)
     - Payment Date (required)
     - Note (optional)
   Behavior:
     - Amount paid can be less than amount due
       (partial payment recorded, balance tracked)
     - Multiple payments can be recorded for same month
       (e.g. partial then remaining)
     - System calculates running balance automatically

4. STUDENT FEE HISTORY SCREEN (Medresa Admin)
   Displays: Full payment history for one student
   Columns: Month, Amount Due, Amount Paid,
            Payment Method, Reference No., Date, Balance
   Summary: Total paid, total outstanding balance
   Actions: Record new payment, Export to PDF

5. MEDRESA FEE OVERVIEW (Medresa Admin)
   Displays: Monthly fee collection summary
             for their medresa
   Columns: Month, Total Students, Total Due,
            Total Collected, Total Outstanding,
            Collection Rate (%)
   Filters: By month range
   Actions: Drill down into any month's details

6. NETWORK FEE OVERVIEW (Super Admin)
   Displays: Fee collection summary across
             all medresas
   Columns: Medresa, Month, Total Due,
            Total Collected, Outstanding,
            Collection Rate (%)
   Filters: By medresa, by month range
   Actions: Drill down into any medresa's fee details

━━━ BUSINESS RULES ━━━

BR-01: Only Super Admin can set or change the
       network-wide monthly fee amount
BR-02: Fee amount changes are versioned with
       effective dates — history never deleted
BR-03: One flat monthly fee applies to all students
       across all medresas equally
BR-04: Medresa Admin records payments for their
       medresa students only
BR-05: Partial payments are allowed — balance
       is tracked automatically
BR-06: Multiple payments can be recorded for
       the same student for the same month
BR-07: Bank transfer payments must include a
       bank reference number
BR-08: Payment date is required and cannot be
       a future date
BR-09: Medresa Admin cannot edit or delete a
       recorded payment — only Super Admin can
BR-10: Outstanding balances carry forward month
       to month until fully paid
BR-11: Teachers have no access to fee data

━━━ DATA ENTITIES ━━━

FeeStructure {
  id, monthly_amount (ETB),
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
  payment_method (enum: cash/bank_transfer),
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


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M09: Salary Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M09 — Salary Management
OWNER: Super Admin exclusively
DEPENDS ON: M01, M02, M03

━━━ SCREENS ━━━

1. SALARY RANK MANAGEMENT SCREEN (Super Admin only)
   Displays: All salary ranks defined network-wide
   Columns: Rank Name, Monthly Amount (ETB),
            No. of Teachers, Status (Active/Inactive)
   Actions: Create Rank, Edit Rank, Deactivate Rank
   Examples: Rank 1 (Junior), Rank 2 (Mid),
             Rank 3 (Senior), Rank 4 (Principal Teacher)
   Behavior:
     - Editing a rank amount creates a new version
       with effective date — history preserved
     - Deactivating a rank does not affect teachers
       already assigned to it

2. ASSIGN RANK TO TEACHER SCREEN (Super Admin only)
   Displays: All teachers in the network
   Columns: Photo, Full Name, Assigned Medresas,
            Current Rank, Monthly Salary
   Actions: Assign / Change Rank
   Fields:
     - Select Teacher
     - Select Rank
     - Effective From Date
   Behavior:
     - A teacher has one rank across the entire network
     - Changing rank is versioned — history preserved
     - New rank takes effect from specified date

3. SALARY PAYMENT SCREEN (Super Admin only)
   Displays: All active teachers with their
             current rank & monthly salary amount
   Columns: Photo, Full Name, Rank, Salary Amount,
            Month, Payment Status (Paid/Unpaid)
   Actions: Record Payment, View Payment History
   Filters: By rank, by payment status, by month

4. RECORD SALARY PAYMENT SCREEN (Super Admin only)
   Fields:
     - Teacher (read only — selected from list)
     - Month & Year (required)
     - Amount (auto-filled from rank, editable
       for one-time adjustments)
     - Bank Reference Number (required)
     - Payment Date (required, cannot be future)
     - Note (optional)
   Behavior:
     - One salary payment per teacher per month
     - Adjustments to amount are logged with reason
     - System flags if a teacher has not been
       paid for the current month

5. TEACHER SALARY HISTORY SCREEN (Super Admin only)
   Displays: Full salary payment history
             for one teacher
   Columns: Month, Rank, Amount, Bank Reference,
            Payment Date, Note
   Summary: Total paid this year, current rank,
            monthly salary amount
   Actions: Export to PDF

6. NETWORK SALARY OVERVIEW SCREEN (Super Admin only)
   Displays: Monthly salary summary across
             the entire network
   Columns: Month, Total Teachers, Total Paid,
            Total Unpaid, Total Amount Disbursed
   Filters: By month range, by rank
   Actions: Drill down into any month's details,
            Export to PDF

━━━ BUSINESS RULES ━━━

BR-01: Salary module is exclusively accessible
       by Super Admin — no other role has any access
BR-02: Salary is determined by rank assigned
       to the teacher network-wide (not per medresa)
BR-03: A teacher has exactly one rank at a time
BR-04: Rank changes are versioned with effective dates
BR-05: Rank amount changes are versioned —
       history never deleted
BR-06: One salary payment recorded per teacher
       per month
BR-07: Bank reference number is mandatory
       for every salary payment
BR-08: Payment date cannot be a future date
BR-09: Amount is auto-filled from rank but can be
       adjusted for one-time cases — adjustment logged
BR-10: System flags unpaid teachers for current month
BR-11: Deactivating a teacher stops future salary
       obligations but preserves payment history
BR-12: Medresa Admins and Teachers have zero
       visibility into salary data

━━━ DATA ENTITIES ━━━

SalaryRank {
  id, name, monthly_amount (ETB),
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
  amount_paid (ETB),
  bank_reference (required),
  payment_date,
  note (nullable),
  is_adjusted (bool),
  adjustment_reason (nullable),
  recorded_by (FK → User),
  created_at, updated_at
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4, M10: Reporting & Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE: M10 — Reporting & Dashboard
OWNER: All roles (scoped by role)
DEPENDS ON: All modules M01 — M09
CALENDAR: Ethiopian (Meskerem — Pagume)

━━━ DASHBOARDS BY ROLE ━━━

1. TEACHER DASHBOARD
   Summary Cards:
     - Total students in my courses
     - Today's attendance rate (%)
     - Pending grade entries
     - Upcoming exam types
   Charts:
     - Attendance trend for my courses (last 30 days)
     - Grade distribution per course (bar chart)
   Quick Actions:
     - Take today's attendance
     - Enter grades
     - View my class roster

2. MEDRESA ADMIN DASHBOARD
   Summary Cards:
     - Total students enrolled
     - Total active courses
     - Today's network attendance rate (%)
     - Total fees collected this month (ETB)
     - Total outstanding fees (ETB)
   Charts:
     - Monthly fee collection vs outstanding (bar chart)
     - Student enrollment trend (line chart)
     - Attendance rate per course (bar chart)
     - Grade average per course (bar chart)
   Quick Actions:
     - Record fee payment
     - View unpaid students
     - Generate monthly report

3. SUPER ADMIN DASHBOARD
   Summary Cards:
     - Total medresas (active/inactive)
     - Total teachers in network
     - Total students across network
     - Total fees collected this month (ETB)
     - Total outstanding fees network-wide (ETB)
     - Total salary disbursed this month (ETB)
     - Unpaid teachers this month (count)
   Charts:
     - Network enrollment per medresa (bar chart)
     - Monthly fee collection across network (line chart)
     - Monthly salary disbursement trend (line chart)
     - Attendance rate per medresa (bar chart)
     - Grade average per medresa (bar chart)
   Quick Actions:
     - View unpaid teachers
     - View fee defaulters
     - Generate network report

━━━ EXPORTABLE REPORTS ━━━

R01. STUDENT ENROLLMENT REPORT
     Scope: Per medresa (Medresa Admin) /
            Network-wide (Super Admin)
     Content: Student list, enrollment date,
              courses enrolled, transfer history,
              status (active/transferred)
     Filters: By medresa, by course, by status,
              by Ethiopian month range
     Export: PDF, Excel

R02. ATTENDANCE REPORT
     Scope: Per course (Teacher) /
            Per medresa (Medresa Admin) /
            Network-wide (Super Admin)
     Content: Daily attendance records, summary
              per student (present/absent/late/excused),
              attendance percentage per student
     Filters: By course, by student, by date range
              (Ethiopian calendar)
     Export: PDF, Excel

R03. FEE COLLECTION REPORT
     Scope: Per medresa (Medresa Admin) /
            Network-wide (Super Admin)
     Content: Fee payments per student per month,
              outstanding balances, collection rate %
     Filters: By medresa, by month, by status
              (paid/partial/unpaid)
     Export: PDF, Excel

R04. SALARY REPORT
     Scope: Network-wide (Super Admin only)
     Content: Salary payments per teacher per month,
              rank, amount, bank reference, unpaid list
     Filters: By rank, by month range, by status
     Export: PDF, Excel

R05. GRADES & RESULTS REPORT
     Scope: Per course (Teacher) /
            Per medresa (Medresa Admin) /
            Network-wide (Super Admin)
     Content: Student grades per exam type per course,
              weighted totals, letter grades, class averages
     Filters: By course, by exam type, by student,
              by Ethiopian academic year
     Export: PDF, Excel

━━━ BUSINESS RULES ━━━

BR-01: All date inputs and displays use Ethiopian
       calendar (Meskerem — Pagume)
BR-02: System stores dates in Gregorian internally
       and converts for display
BR-03: Teachers export only their own course reports
BR-04: Medresa Admins export only their medresa reports
BR-05: Super Admin exports any report network-wide
BR-06: Salary reports are Super Admin only —
       never visible to other roles
BR-07: All exports are timestamped with generation
       date in Ethiopian calendar
BR-08: Charts refresh in real time from live data
BR-09: Reports can be filtered by Ethiopian month,
       quarter, or full academic year

━━━ DATA ENTITIES ━━━

No new tables — M10 reads from all previous modules.
Ethiopian date conversion utility required:
  EthiopianDateUtil {
    toEthiopian(gregorianDate) → EthiopianDate
    toGregorian(ethiopianDate) → GregorianDate
    getCurrentEthiopianYear() → year
    getCurrentEthiopianMonth() → month
  }



  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 5: Tech Stack & Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM: Harari Medresa Management System (HMMS)
PLATFORM: Web + PWA (installable on Android & iOS)
BUILDER: Solo developer + AI agents
HOSTING: Local (dev) → VPS (production)

━━━ TECH STACK ━━━

FRONTEND
  Framework:       React (Vite)
  Routing:         TanStack Router
  Data Fetching:   TanStack Query (server state)
  UI Components:   Shadcn/ui + Tailwind CSS
  Forms:           React Hook Form + Zod (validation)
  Charts:          Recharts
  PDF Export:      React-PDF / jsPDF
  Excel Export:    SheetJS (xlsx)
  PWA:             Vite PWA Plugin (Workbox)
  i18n:            i18next (Amharic, English, Arabic + RTL)
  Ethiopian Date:  ethiopian-date npm package
  HTTP Client:     Axios

BACKEND
  Runtime:         Node.js
  Framework:       Express.js
  Authentication:  JWT (access token + refresh token)
  Password Reset:  Nodemailer (email reset link)
  File Upload:     Multer (photos — jpg/png, max 2MB)
  Validation:      Zod
  ORM:             Prisma
  Task Scheduler:  node-cron (attendance midnight lock,
                   monthly unpaid salary flags)

DATABASE
  Primary DB:      PostgreSQL
  File Storage:    Local disk (dev) →
                   VPS file system or S3-compatible
                   object storage (production)

DEVOPS
  Local Dev:       Docker Compose
                   (app + postgres containers)
  Version Control: Git + GitHub
  VPS:             Ubuntu 22.04 LTS
  Reverse Proxy:   Nginx
  Process Manager: PM2
  SSL:             Let's Encrypt (Certbot)
  Env Management:  dotenv

━━━ SYSTEM ARCHITECTURE ━━━

CLIENT (Browser / PWA)
  └── React + TanStack Router + TanStack Query
        ├── Public routes: Login, Forgot Password
        └── Protected routes (JWT guarded):
              ├── /super-admin/* → Super Admin layout
              ├── /admin/*       → Medresa Admin layout
              └── /teacher/*    → Teacher layout

API LAYER (Express.js REST API)
  └── /api/v1/
        ├── /auth          → Login, logout, refresh, reset
        ├── /users         → M01 User management
        ├── /medresas      → M02 Medresa management
        ├── /teachers      → M03 Teacher management
        ├── /courses       → M04 Course management
        ├── /students      → M05 Student management
        ├── /attendance    → M06 Attendance tracking
        ├── /grades        → M07 Grades & results
        ├── /fees          → M08 Fee management
        ├── /salaries      → M09 Salary management
        └── /reports       → M10 Reporting & dashboard

MIDDLEWARE STACK (per request)
  1. CORS
  2. Rate Limiter
  3. JWT Auth Verification
  4. Role Guard (super_admin / medresa_admin / teacher)
  5. Medresa Scope Guard (data isolation per medresa)
  6. Request Validator (Zod)
  7. Route Handler
  8. Error Handler

DATABASE LAYER (PostgreSQL via Prisma)
  └── Schema mirrors all module entities (M01—M09)
      with proper foreign keys & indexes

SCHEDULED JOBS (node-cron)
  └── Midnight: lock submitted attendance sessions
  └── Monthly:  flag unpaid teacher salaries

━━━ FOLDER STRUCTURE ━━━

hmms/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # shared UI components
│   │   ├── features/        # one folder per module
│   │   │   ├── auth/
│   │   │   ├── medresas/
│   │   │   ├── teachers/
│   │   │   ├── courses/
│   │   │   ├── students/
│   │   │   ├── attendance/
│   │   │   ├── grades/
│   │   │   ├── fees/
│   │   │   ├── salaries/
│   │   │   └── reports/
│   │   ├── hooks/           # shared custom hooks
│   │   ├── lib/             # axios, i18n, date utils
│   │   ├── routes/          # TanStack Router routes
│   │   ├── store/           # global client state
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # full DB schema
│   ├── src/
│   │   ├── modules/         # one folder per module
│   │   │   ├── auth/
│   │   │   ├── medresas/
│   │   │   ├── teachers/
│   │   │   ├── courses/
│   │   │   ├── students/
│   │   │   ├── attendance/
│   │   │   ├── grades/
│   │   │   ├── fees/
│   │   │   ├── salaries/
│   │   │   └── reports/
│   │   ├── middleware/      # auth, role, scope guards
│   │   ├── jobs/            # cron jobs
│   │   ├── lib/             # mailer, storage, ethiopian date
│   │   ├── utils/
│   │   └── app.ts
│   └── package.json
│
├── docker-compose.yml
└── README.md

━━━ PWA CONFIGURATION ━━━

  Installable:     Yes (Add to Home Screen on Android/iOS)
  Offline Support: Login page cached offline
                   Last loaded dashboard cached
  Sync:            TanStack Query refetches on reconnect
  Icons:           Custom HMMS app icon
  Theme Color:     Islamic green (#1B6B3A)


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 6: Database Schema,
   Security, Performance & Standards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYSTEM: Harari Medresa Management System (HMMS)
DATABASE: PostgreSQL + Prisma ORM

━━━ SECTION 1: SECURITY ARCHITECTURE ━━━

LAYER 1 — NETWORK LEVEL
  - VPS firewall (UFW): only ports 22, 80, 443 open
  - PostgreSQL port 5432 NOT exposed to public internet
  - Nginx reverse proxy — API never directly exposed
  - SSL/TLS enforced on all connections (Let's Encrypt)
  - Rate limiting: 100 req/min per IP (express-rate-limit)
  - Helmet.js: HTTP security headers on all responses
  - CORS: whitelist frontend domain only

LAYER 2 — APPLICATION LEVEL
  - JWT access token (15 min expiry)
  - JWT refresh token (7 days, stored in httpOnly cookie)
  - Refresh token rotation on every use
  - Refresh tokens stored hashed in DB (not plain)
  - Role Guard middleware: checks user role per route
  - Medresa Scope Guard: injects medresa_id from JWT,
    all queries filtered by it automatically
  - Zod validation on every incoming request body
  - File upload: type check (jpg/png only), size (2MB max),
    filename sanitized, stored outside public directory
  - Password: bcrypt hashed (salt rounds: 12)
  - Password reset token: hashed before storage,
    expires in 1 hour, single use only
  - No sensitive data in JWT payload (no passwords,
    no salary info, no fee amounts)

LAYER 3 — DATABASE LEVEL (PostgreSQL RLS)
  - Two DB roles:
      sefinet_app   → used by application (limited rights)
      sefinet_admin → used for migrations only (full rights)
  - sefinet_app has NO direct table access
  - All access via DB functions and views with
    SECURITY DEFINER
  - Row Level Security (RLS) enabled on all tables
  - RLS policies enforce medresa_id isolation:
      Teachers see only their medresa rows
      Medresa Admins see only their medresa rows
      Super Admin bypasses RLS via app-level flag
  - Audit log written via DB triggers (cannot be
    bypassed by application code)
  - Soft deletes enforced at DB level via CHECK
    constraints (deleted_at nullable, never hard delete)

LAYER 4 — AUDIT LEVEL
  - Every INSERT, UPDATE, soft-DELETE on critical
    tables triggers an audit log entry
  - Audit log is append-only (no UPDATE/DELETE allowed
    on audit_logs table even for super admin)
  - Audit captures: table, record_id, action,
    old_values (JSONB), new_values (JSONB),
    performed_by (user_id), performed_at, ip_address

━━━ SECTION 2: DATABASE SCHEMA ━━━

GLOBAL CONVENTIONS:
  - Every table has: id (UUID), created_at, updated_at
  - Soft delete: deleted_at (nullable timestamp)
    on all critical tables
  - Multi-language fields: stored as JSONB
    { "en": "...", "am": "...", "ar": "..." }
  - All monetary amounts: Integer (Ethiopian cents)
    e.g. 50000 = 500.00 ETB (avoids float precision)
  - All dates: stored as Gregorian, displayed as
    Ethiopian via utility
  - Indexes on all foreign keys and frequently
    queried fields
  - UUID primary keys (not sequential integers)
    for security (prevents enumeration attacks)

── M01: USER & AUTH ──────────────────────────

/// Stores all system users (super admin & teachers)
model User {
  id              String    @id @default(uuid())
  full_name       String
  phone           String    @unique
  email           String    @unique
  password_hash   String
  is_super_admin  Boolean   @default(false)
  status          UserStatus @default(ACTIVE)
  deleted_at      DateTime?

  // Relations
  teacher         Teacher?
  reset_tokens    PasswordResetToken[]
  refresh_tokens  RefreshToken[]
  audit_logs      AuditLog[]

  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@index([email])
  @@index([phone])
  @@index([status])
}

/// Password reset tokens — hashed, single use, 1hr expiry
model PasswordResetToken {
  id          String    @id @default(uuid())
  user_id     String
  token_hash  String    @unique
  expires_at  DateTime
  used        Boolean   @default(false)
  user        User      @relation(fields: [user_id], references: [id])
  created_at  DateTime  @default(now())

  @@index([token_hash])
  @@index([user_id])
}

/// Refresh tokens — rotated on every use, stored hashed
model RefreshToken {
  id          String    @id @default(uuid())
  user_id     String
  token_hash  String    @unique
  expires_at  DateTime
  revoked     Boolean   @default(false)
  user        User      @relation(fields: [user_id], references: [id])
  created_at  DateTime  @default(now())

  @@index([token_hash])
  @@index([user_id])
}

── M02: MEDRESA ───────────────────────────────

/// Islamic school in the Harari network
model Medresa {
  id          String       @id @default(uuid())
  name        String       @unique
  location    String
  phone       String?
  status      Status       @default(ACTIVE)
  deleted_at  DateTime?

  // Relations
  teacher_medresas  TeacherMedresa[]
  students          Student[]
  medresa_courses   MedresaCourse[]
  fee_payments      FeePayment[]
  fee_balances      FeeBalance[]
  salary_payments   SalaryPayment[]

  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  @@index([status])
}

── M03: TEACHER ───────────────────────────────

/// Network-level teacher entity (not owned by one medresa)
model Teacher {
  id               String    @id @default(uuid())
  user_id          String    @unique
  full_name        String
  phone            String    @unique
  email            String    @unique
  /// Stored as JSONB for multilingual support
  /// { "en": "Quran", "am": "ቁርአን", "ar": "القرآن" }
  specialization   Json
  date_joined      DateTime
  photo_url        String?
  status           Status    @default(ACTIVE)
  deleted_at       DateTime?

  // Relations
  user             User      @relation(fields: [user_id], references: [id])
  teacher_medresas TeacherMedresa[]
  teacher_ranks    TeacherRank[]
  salary_payments  SalaryPayment[]
  course_assignments CourseAssignment[]
  attendance_sessions AttendanceSession[]
  grades           Grade[]
  grade_edit_requests GradeEditRequest[]

  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  @@index([status])
  @@index([user_id])
}

/// Teacher role scoped per medresa (join table)
/// RLS policy applied: users see only their medresa rows
model TeacherMedresa {
  id             String          @id @default(uuid())
  teacher_id     String
  medresa_id     String
  role           MedresaRole     @default(TEACHER)
  assigned_since DateTime        @default(now())
  deleted_at     DateTime?

  teacher        Teacher         @relation(fields: [teacher_id], references: [id])
  medresa        Medresa         @relation(fields: [medresa_id], references: [id])

  created_at     DateTime        @default(now())
  updated_at     DateTime        @updatedAt

  @@unique([teacher_id, medresa_id])
  @@index([medresa_id])
  @@index([teacher_id])
  @@index([role])
}

── M04: COURSE ────────────────────────────────

/// Master course list — created by Super Admin, shared network-wide
model Course {
  id           String    @id @default(uuid())
  /// { "en": "Quran Recitation", "am": "...", "ar": "..." }
  name         Json
  /// { "en": "...", "am": "...", "ar": "..." }
  description  Json
  level        CourseLevel
  status       Status    @default(ACTIVE)
  deleted_at   DateTime?

  medresa_courses MedresaCourse[]

  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt

  @@index([status])
  @@index([level])
}

/// Course activated per medresa by Medresa Admin
model MedresaCourse {
  id           String    @id @default(uuid())
  medresa_id   String
  course_id    String
  status       Status    @default(ACTIVE)
  activated_at DateTime  @default(now())
  deleted_at   DateTime?

  medresa      Medresa   @relation(fields: [medresa_id], references: [id])
  course       Course    @relation(fields: [course_id], references: [id])
  assignments  CourseAssignment[]
  student_courses StudentCourse[]
  attendance_sessions AttendanceSession[]
  grades       Grade[]

  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt

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

── M05: STUDENT ───────────────────────────────

/// Student — belongs to one medresa at a time
model Student {
  id                  String    @id @default(uuid())
  full_name           String
  date_of_birth       DateTime
  gender              Gender
  address             String
  guardian_name       String
  guardian_phone      String
  photo_url           String?
  current_medresa_id  String
  status              StudentStatus @default(ACTIVE)
  enrolled_at         DateTime  @default(now())
  deleted_at          DateTime?

  current_medresa     Medresa   @relation(fields: [current_medresa_id], references: [id])
  student_courses     StudentCourse[]
  transfers           StudentTransfer[]
  attendance_records  AttendanceRecord[]
  grades              Grade[]
  fee_payments        FeePayment[]
  fee_balances        FeeBalance[]

  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@index([current_medresa_id])
  @@index([status])
}

/// Student enrolled in a specific course within a medresa
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
  id               String    @id @default(uuid())
  student_id       String
  from_medresa_id  String
  to_medresa_id    String
  transfer_date    DateTime
  reason           String?

  student          Student   @relation(fields: [student_id], references: [id])

  created_at       DateTime  @default(now())

  @@index([student_id])
  @@index([from_medresa_id])
  @@index([to_medresa_id])
}

── M06: ATTENDANCE ────────────────────────────

/// One attendance session per course per day
model AttendanceSession {
  id                String        @id @default(uuid())
  medresa_course_id String
  teacher_id        String
  date              DateTime      @db.Date
  submitted_at      DateTime?
  is_locked         Boolean       @default(false)
  deleted_at        DateTime?

  medresa_course    MedresaCourse @relation(fields: [medresa_course_id], references: [id])
  teacher           Teacher       @relation(fields: [teacher_id], references: [id])
  records           AttendanceRecord[]

  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@unique([medresa_course_id, date])
  @@index([date])
  @@index([teacher_id])
  @@index([is_locked])
}

/// Individual student attendance record per session
model AttendanceRecord {
  id          String            @id @default(uuid())
  session_id  String
  student_id  String
  status      AttendanceStatus
  note        String?
  edited_at   DateTime?
  deleted_at  DateTime?

  session     AttendanceSession @relation(fields: [session_id], references: [id])
  student     Student           @relation(fields: [student_id], references: [id])

  created_at  DateTime          @default(now())
  updated_at  DateTime          @updatedAt

  @@unique([session_id, student_id])
  @@index([student_id])
  @@index([status])
}

── M07: GRADES ────────────────────────────────

/// Exam types defined network-wide by Super Admin
model ExamType {
  id          String    @id @default(uuid())
  /// { "en": "Midterm Exam", "am": "...", "ar": "..." }
  name        Json
  max_score   Int
  weight      Int       // percentage, all active weights sum to 100
  status      Status    @default(ACTIVE)
  deleted_at  DateTime?

  grades      Grade[]

  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  @@index([status])
}

/// Student grade per exam type per course
model Grade {
  id                String        @id @default(uuid())
  student_id        String
  medresa_course_id String
  exam_type_id      String
  teacher_id        String
  numeric_score     Int           // stored as integer (e.g. 85)
  letter_grade      LetterGrade
  submitted_at      DateTime      @default(now())
  deleted_at        DateTime?

  student           Student       @relation(fields: [student_id], references: [id])
  medresa_course    MedresaCourse @relation(fields: [medresa_course_id], references: [id])
  exam_type         ExamType      @relation(fields: [exam_type_id], references: [id])
  teacher           Teacher       @relation(fields: [teacher_id], references: [id])
  edit_requests     GradeEditRequest[]

  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@unique([student_id, medresa_course_id, exam_type_id])
  @@index([student_id])
  @@index([medresa_course_id])
  @@index([teacher_id])
}

/// Grade edit request — requires admin approval
model GradeEditRequest {
  id                String            @id @default(uuid())
  grade_id          String
  requested_by      String
  current_score     Int
  requested_score   Int
  reason            String
  status            ApprovalStatus    @default(PENDING)
  reviewed_by       String?
  reviewed_at       DateTime?
  rejection_reason  String?
  deleted_at        DateTime?

  grade             Grade             @relation(fields: [grade_id], references: [id])
  teacher           Teacher           @relation(fields: [requested_by], references: [id])

  created_at        DateTime          @default(now())
  updated_at        DateTime          @updatedAt

  @@index([grade_id])
  @@index([status])
}

── M08: FEE ───────────────────────────────────

/// Network-wide fee structure — versioned, never deleted
model FeeStructure {
  id              String    @id @default(uuid())
  monthly_amount  Int       // in Ethiopian cents
  effective_from  DateTime
  status          Status    @default(ACTIVE)
  created_by      String
  deleted_at      DateTime?

  fee_payments    FeePayment[]

  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@index([status])
  @@index([effective_from])
}

/// Individual fee payment recorded per student per month
model FeePayment {
  id                String        @id @default(uuid())
  student_id        String
  medresa_id        String
  fee_structure_id  String
  month             Int           // 1-12 (Gregorian)
  year              Int
  amount_due        Int           // in Ethiopian cents
  amount_paid       Int           // in Ethiopian cents
  payment_method    PaymentMethod
  bank_reference    String?
  payment_date      DateTime
  note              String?
  recorded_by       String
  deleted_at        DateTime?

  student           Student       @relation(fields: [student_id], references: [id])
  medresa           Medresa       @relation(fields: [medresa_id], references: [id])
  fee_structure     FeeStructure  @relation(fields: [fee_structure_id], references: [id])

  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@index([student_id])
  @@index([medresa_id])
  @@index([month, year])
  @@index([payment_date])
}

/// Running fee balance per student per medresa
model FeeBalance {
  id                  String    @id @default(uuid())
  student_id          String
  medresa_id          String
  total_due           Int       // in Ethiopian cents
  total_paid          Int       // in Ethiopian cents
  outstanding_balance Int       // in Ethiopian cents

  student             Student   @relation(fields: [student_id], references: [id])
  medresa             Medresa   @relation(fields: [medresa_id], references: [id])

  updated_at          DateTime  @updatedAt

  @@unique([student_id, medresa_id])
  @@index([medresa_id])
  @@index([outstanding_balance])
}

── M09: SALARY ────────────────────────────────

/// Salary rank levels — versioned, never deleted
model SalaryRank {
  id              String    @id @default(uuid())
  /// { "en": "Senior Teacher", "am": "...", "ar": "..." }
  name            Json
  monthly_amount  Int       // in Ethiopian cents
  effective_from  DateTime
  status          Status    @default(ACTIVE)
  deleted_at      DateTime?

  teacher_ranks   TeacherRank[]
  salary_payments SalaryPayment[]

  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@index([status])
}

/// Teacher rank assignment — versioned history
model TeacherRank {
  id              String      @id @default(uuid())
  teacher_id      String
  salary_rank_id  String
  effective_from  DateTime
  deleted_at      DateTime?

  teacher         Teacher     @relation(fields: [teacher_id], references: [id])
  salary_rank     SalaryRank  @relation(fields: [salary_rank_id], references: [id])

  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  @@index([teacher_id])
  @@index([effective_from])
}

/// Monthly salary payment per teacher
model SalaryPayment {
  id                  String      @id @default(uuid())
  teacher_id          String
  salary_rank_id      String
  month               Int
  year                Int
  amount_paid         Int         // in Ethiopian cents
  bank_reference      String
  payment_date        DateTime
  note                String?
  is_adjusted         Boolean     @default(false)
  adjustment_reason   String?
  recorded_by         String
  deleted_at          DateTime?

  teacher             Teacher     @relation(fields: [teacher_id], references: [id])
  salary_rank         SalaryRank  @relation(fields: [salary_rank_id], references: [id])

  created_at          DateTime    @default(now())
  updated_at          DateTime    @updatedAt

  @@unique([teacher_id, month, year])
  @@index([teacher_id])
  @@index([month, year])
  @@index([payment_date])
}

── AUDIT LOG ──────────────────────────────────

/// Append-only audit trail — written by DB triggers
/// No UPDATE or DELETE permitted on this table
model AuditLog {
  id           String    @id @default(uuid())
  table_name   String
  record_id    String
  action       AuditAction  // INSERT, UPDATE, SOFT_DELETE
  old_values   Json?
  new_values   Json?
  performed_by String?   // user_id (nullable for system actions)
  ip_address   String?
  performed_at DateTime  @default(now())

  user         User?     @relation(fields: [performed_by], references: [id])

  @@index([table_name])
  @@index([record_id])
  @@index([performed_by])
  @@index([performed_at])
  @@index([action])
}

── ENUMS ───────────────────────────────────────

enum UserStatus      { ACTIVE INACTIVE }
enum Status          { ACTIVE INACTIVE }
enum StudentStatus   { ACTIVE TRANSFERRED }
enum MedresaRole     { TEACHER ADMIN }
enum Gender          { MALE FEMALE }
enum CourseLevel     { BEGINNER INTERMEDIATE ADVANCED }
enum AttendanceStatus{ PRESENT ABSENT LATE EXCUSED }
enum LetterGrade     { A B C D F }
enum PaymentMethod   { CASH BANK_TRANSFER }
enum ApprovalStatus  { PENDING APPROVED REJECTED }
enum AuditAction     { INSERT UPDATE SOFT_DELETE }

━━━ SECTION 3: PERFORMANCE STRATEGY ━━━

INDEXING:
  - All foreign keys indexed (Prisma auto + manual)
  - Composite indexes on frequent query patterns:
      (medresa_id, status) — most list queries
      (student_id, month, year) — fee queries
      (teacher_id, month, year) — salary queries
      (medresa_course_id, date) — attendance queries
  - Partial indexes for soft deletes:
      WHERE deleted_at IS NULL on all critical tables

QUERY OPTIMIZATION:
  - TanStack Query: stale-while-revalidate caching
  - Pagination on all list endpoints (cursor-based)
  - Select only needed fields (no SELECT *)
  - Prisma: use include sparingly, prefer select
  - Dashboard aggregates: pre-computed via
    materialized views refreshed nightly

CONNECTION POOLING:
  - PgBouncer in transaction mode on VPS
  - Max 20 connections to PostgreSQL
  - Prisma connection limit set per environment

CACHING:
  - Node-cache for static data (exam types,
    fee structure, salary ranks) — 1hr TTL
  - TanStack Query client-side cache:
      dashboard data: 5 min stale time
      student lists: 2 min stale time
      attendance: 30 sec stale time (real-time feel)

━━━ SECTION 4: API STANDARDS ━━━

VERSIONING:
  - All routes prefixed: /api/v1/
  - Breaking changes → /api/v2/ (v1 maintained 6 months)
  - Version in response header: X-API-Version: 1.0

RESPONSE FORMAT (all endpoints):
  Success:
  {
    "success": true,
    "data": { ... },
    "meta": {             // for paginated responses
      "total": 100,
      "page": 1,
      "limit": 20,
      "cursor": "..."
    }
  }

  Error:
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "...",
      "details": [ ... ]  // validation errors
    }
  }

ERROR CODES (standardized):
  UNAUTHORIZED        401 — invalid/expired token
  FORBIDDEN           403 — valid token, wrong role
  NOT_FOUND           404 — resource not found
  VALIDATION_ERROR    422 — Zod validation failed
  CONFLICT            409 — unique constraint violation
  INTERNAL_ERROR      500 — unexpected server error

HTTP METHODS:
  GET    → read (list or single)
  POST   → create
  PATCH  → partial update
  DELETE → soft delete (sets deleted_at)
  Never use DELETE for hard delete

━━━ SECTION 5: DOCUMENTATION STANDARDS ━━━

INLINE (Prisma Schema):
  - Every model has a /// doc comment
  - Every non-obvious field has a // comment
  - All JSONB fields document expected structure

MARKDOWN DOCS (one file per module):
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

Each module doc contains:
  - Purpose & scope
  - Actors & permissions
  - All API endpoints with request/response examples
  - Business rules
  - Data model diagram (ASCII)
  - Edge cases & error handling

━━━ SECTION 6: FUTURE-PROOFING NOTES ━━━

WHAT IS READY FOR FUTURE EXPANSION:
  - Multi-language JSONB fields: add new language
    without schema migration
  - API versioning: add v2 routes without breaking v1
  - Audit log: foundation for compliance reporting
  - Soft delete: full data recovery always possible
  - UUID PKs: safe to merge data from multiple
    instances if network grows
  - Modular folder structure: add new modules
    without touching existing ones

POTENTIAL FUTURE MODULES:
  - M11: Parent Portal (view child's attendance/grades)
  - M12: SMS Notifications (fee reminders, results)
  - M13: Academic Year Management
  - M14: Library Management
  - M15: Timetable / Schedule Management



  