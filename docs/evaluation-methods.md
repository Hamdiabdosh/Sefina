# Evaluation Methods — Sefinet Al Neja

This document defines the methodology and criteria for evaluating the logic and User Experience (UX) of the Sefinet Al Neja (Harari Medresa Management System). These methods ensure the system meets the high standards required for its mission-critical role in the medresa network.

---

## 1. Logic Evaluation Methods

Logic evaluation focuses on the correctness, security, and integrity of the system's business rules and data management.

### 1.1 Functional Correctness (Business Rules)
*   **Method:** Traceability Matrix testing. Every Business Rule (BR-XX) defined in the Master Project Specification must be mapped to a test case (automated or manual).
*   **Criteria:**
    *   M01-M10 modules perform exactly as described in Phase 4 of the Master Spec.
    *   Automated scripts (e.g., `verify-mXX-api.sh`) pass with 100% success.
    *   Calculation logic (Grades, Fees, Salaries) matches the defined formulas exactly.

### 1.2 Security & Access Control
*   **Method:** Role-based Access Control (RBAC) Audit.
*   **Criteria:**
    *   **Isolation:** Medresa Admins MUST NOT see data from other medresas.
    *   **Privilege Escalation:** Verify that Teachers cannot access Admin routes/API endpoints.
    *   **Salary Privacy:** Ensure M09 data is exclusively accessible to the Super Admin.
    *   **JWT Integrity:** Verify token expiration and invalidation (especially on deactivation).

### 1.3 Data Integrity & Consistency
*   **Method:** Database Constraint & Schema Validation.
*   **Criteria:**
    *   Foreign keys are correctly enforced.
    *   Historical data is preserved even after deactivation (Medresas, Teachers, Students).
    *   Versioned records (Fee Structure, Salary Ranks) are immutable once replaced.

### 1.4 Edge Case Handling
*   **Method:** Boundary Value Analysis.
*   **Criteria:**
    *   System behavior with zero records (e.g., empty student list).
    *   Handling of future dates in attendance/payments (must be blocked).
    *   Midnight lock for attendance edits (M06).
    *   Multilingual input (Amharic/Arabic/English) in JSON fields.

---

## 2. UX/UI Evaluation Methods

UX evaluation ensures the system is usable, aesthetically consistent, and culturally appropriate.

### 2.1 Visual Consistency (Design System)
*   **Method:** Heuristic Evaluation against the UI/UX Specification.
*   **Criteria:**
    *   **Colors:** Strict adherence to Teal/Gold/Cream palette.
    *   **Patterns:** Islamic geometric SVG pattern present on all headers (12-15% opacity).
    *   **Typography:** Correct font sizes and weights used per the typography scale.
    *   **Components:** Buttons, Inputs, and Badges match the "Component Specifications" (Section 2.6).

### 2.2 Mobile-First Responsiveness
*   **Method:** Cross-Device Testing (390px viewport vs. Desktop).
*   **Criteria:**
    *   Touch targets are minimum 44x44px.
    *   No "hover-only" logic.
    *   Layout shifts gracefully from Bottom Nav (mobile) to Sidebar (desktop).

### 2.3 Interaction Patterns
*   **Method:** Usability Walkthrough.
*   **Criteria:**
    *   **Navigation:** Breadcrumbs/Back buttons follow the "Push/Pop" model.
    *   **Feedback:** Loading spinners and error messages are clear and non-disruptive.
    *   **Speed:** UI feels snappy; TanStack Query handles caching effectively.

### 2.4 Internationalization & Localization (i18n/L10n)
*   **Method:** Language Toggle Stress Test.
*   **Criteria:**
    *   Instant switch between English, Amharic, and Arabic.
    *   **RTL Support:** Arabic layout correctly flips (Right-to-Left).
    *   **Calendar:** Ethiopian calendar used for all display dates (M10).

---

## 3. Module-Specific Evaluation Criteria

| Module | Logic Key Checkpoint | UX Key Checkpoint |
|--------|----------------------|-------------------|
| **M01 User** | Phone/Email interchangeably for login | Login screen branding & geometry |
| **M02 Medresa** | Multi-tenant isolation | Medresa list card layout |
| **M03 Teacher** | Role-per-medresa assignment | Teacher profile & photo handling |
| **M04 Course** | Master list vs. Medresa activation | Course assignment workflow |
| **M05 Student** | Transfer logic (preserving history) | Student card (photo + guardian info) |
| **M06 Attendance** | Midnight lock & status defaults | Daily roster touch interaction |
| **M07 Grades** | Weight-based calculation (100% sum) | Grade entry speed (mobile) |
| **M08 Fees** | Balance tracking & versioned amounts | Paid/Unpaid/Partial badge visibility |
| **M09 Salary** | Super Admin exclusivity | Salary history timeline |
| **M10 Reporting** | Ethiopian calendar integration | Charts clarity (mobile vs desktop) |

---

## 4. Evaluation Workflow

1.  **Automated Audit:** Run all `verify-*.sh` scripts in the `scripts/` directory.
2.  **Manual Heuristic Pass:** Senior Engineer walks through each screen ID (S01-S47) with the UI/UX Spec in hand.
3.  **Cross-Device Pass:** Validate on iOS Safari, Android Chrome, and Desktop Chrome/Firefox.
4.  **Cultural Review:** Ensure Amharic and Arabic translations are contextually accurate.
