# Sefinet Al Neja — Use case diagram

This document summarizes **who** can do **what** in the platform today, aligned with backend modules (`m01`–`m05`) and the role model in the product roadmap. Future epics (attendance, grades, fees, payroll, reporting) are noted below the diagrams.

---

## System context (actors)

| Actor | Description |
|--------|-------------|
| **Super Admin** | Network operator: all medresas, global catalog, teachers, and cross-tenant operations. |
| **Medresa Admin** | School administrator for one or more medresas: dashboard, courses activated at their school, student registry, and teacher/course assignments within policy. |
| **Teacher** | Instructor: dashboard and students/courses in their teaching scope. |
| **Pending user** | Authenticated account **without** app access yet; sees the pending-access experience until activated. |
| **Google** | External IdP for Google sign-in. |
| **Email (SMTP)** | Outbound mail for password reset and operator actions such as resend invite. |

---

## Use case diagram (implemented scope)

The diagram reflects the current **web + API** surface (M01–M05). Super Admin may also perform Medresa Admin and Teacher use cases where the UI/API allows (role checks in `frontend/src/router.tsx` and backend guards).

```mermaid
useCaseDiagram
  left to right direction

  actor "Super Admin" as SA
  actor "Medresa Admin" as MA
  actor "Teacher" as T
  actor "Pending user" as PU

  actor "Google" as GOV
  actor "Email (SMTP)" as MAIL

  package "Sefina platform (M01–M05)" {
    package "M01 — Authentication & session" {
      usecase "Sign in (email/password)" as UC_Login
      usecase "Sign in (Google)" as UC_Google
      usecase "Refresh session" as UC_Refresh
      usecase "Sign out" as UC_Logout
      usecase "Request password reset" as UC_PWREQ
      usecase "Confirm password reset" as UC_PWCONF
      usecase "View current account (/me)" as UC_ME
    }

    package "M01 — User administration (elevated)" {
      usecase "Resend user invite" as UC_RESEND
      usecase "Set user password (operator)" as UC_SETPW
    }

    package "M02 — Medresa (school) registry" {
      usecase "Create/update/list medresas" as UC_MED_CRUD
      usecase "Activate or deactivate medresa" as UC_MED_STATUS
    }

    package "M03 — Teachers" {
      usecase "Create/update/list teacher profiles" as UC_TCH_CRUD
      usecase "Assign or remove teacher at medresa" as UC_TCH_ASSIGN
    }

    package "M04 — Courses" {
      usecase "Manage global course catalog" as UC_CAT
      usecase "Activate course at medresa" as UC_MED_COURSE
      usecase "Assign teacher to medresa course" as UC_ASSN_CRS
    }

    package "M05 — Students" {
      usecase "Manage students within medresa" as UC_STU_CRUD
      usecase "Enroll or move students across courses" as UC_STU_ENR
      usecase "View students in teaching scope" as UC_TCH_STU
    }

    package "Dashboards & access" {
      usecase "View medresa dashboard" as UC_DASH_M
      usecase "View teacher dashboard" as UC_DASH_T
      usecase "View pending-access state" as UC_PENDING
    }
  }

  %% Associations: who participates in which use cases

  PU --> UC_PENDING

  SA --> UC_DASH_M
  SA --> UC_DASH_T
  MA --> UC_DASH_M
  T --> UC_DASH_T

  SA --> UC_Login
  MA --> UC_Login
  T --> UC_Login
  PU --> UC_Login

  SA --> UC_Google
  MA --> UC_Google
  T --> UC_Google
  PU --> UC_Google

  SA --> UC_Refresh
  MA --> UC_Refresh
  T --> UC_Refresh
  PU --> UC_Refresh

  SA --> UC_Logout
  MA --> UC_Logout
  T --> UC_Logout
  PU --> UC_Logout

  SA --> UC_PWREQ
  MA --> UC_PWREQ
  T --> UC_PWREQ

  SA --> UC_PWCONF
  MA --> UC_PWCONF
  T --> UC_PWCONF

  SA --> UC_ME
  MA --> UC_ME
  T --> UC_ME
  PU --> UC_ME

  SA --> UC_RESEND
  SA --> UC_SETPW

  SA --> UC_MED_CRUD
  SA --> UC_MED_STATUS

  SA --> UC_TCH_CRUD
  MA --> UC_TCH_ASSIGN
  SA --> UC_TCH_ASSIGN

  SA --> UC_CAT
  MA --> UC_MED_COURSE
  SA --> UC_MED_COURSE

  MA --> UC_ASSN_CRS
  SA --> UC_ASSN_CRS

  MA --> UC_STU_CRUD
  SA --> UC_STU_CRUD

  MA --> UC_STU_ENR
  SA --> UC_STU_ENR

  T --> UC_TCH_STU
  SA --> UC_TCH_STU

  %% Secondary actors (external systems)

  UC_Google --> GOV
  UC_PWREQ --> MAIL
  UC_PWCONF --> MAIL
  UC_RESEND --> MAIL
```

### Permission notes (concise)

- **Super Admin** is intended to perform **all** use cases above when business rules allow (e.g. cross-medresa teacher and student operations).
- **Medresa Admin** operates **inside assigned medresa(s)**; medresa and global catalog mutations are not in their lane.
- **Teacher** access to **student profile** and **course** views is limited to **scoped** enrollment (enforced in API and UI).
- **Pending user** uses authentication and profile use cases but is gated to **pending access** until `hasAppAccess` is true.

---

## Roadmap use cases (not implemented yet)

From `docs/Sefinet_Task_Board.md`, planned actors largely remain **Super Admin**, **Medresa Admin**, and **Teacher**, with **Super Admin** alone for sensitive areas (e.g. salary):

| Epic | Representative future use cases |
|------|-----------------------------------|
| **M06 Attendance** | Record daily attendance; correct entries with audit reason; view summaries. |
| **M07 Grades** | Enter grades for assigned classes; view term/course summaries; role-scoped result views. |
| **M08 Fees** | Define fees; record payments; view balances (**not** visible to Teacher). |
| **M09 Salary** | Configure scales; run payroll (**Super Admin only**). |
| **M10 Reporting** | KPI dashboards; exports (PDF/spreadsheets) scoped by role. |

---

## Viewing the diagram

- **GitHub / GitLab**: Renders Mermaid in markdown natively.
- **VS Code / Cursor**: Use a Mermaid preview extension, or paste the fenced block into [mermaid.live](https://mermaid.live).

**Export with Mermaid CLI (`mmdc`)** needs a Chromium install for Puppeteer (e.g. after `npm i -g @mermaid-js/mermaid-cli`, run `npx puppeteer browsers install chrome` or use a machine that already has Chrome). In headless/CI sandboxes without a browser, prefer **mermaid.live** or markdown preview instead.

If you want a **PlantUML** or **draw.io** version for formal UML tooling, say which format you prefer and the target audience (developers vs stakeholders).
