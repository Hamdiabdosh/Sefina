# Sefinet Al Neja — UI/UX Specification & Screen Prototype Guide

> **Note:** Project rebranded from HMMS. CSS tokens may still use the `--hmms-*` prefix until a design-token pass.
## Sefinet Al Neja — Harari Medresa Management System
**Version:** 1.0 | **Platform:** Mobile-first PWA | **Style:** Modern Islamic

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Layout & Navigation](#3-layout--navigation)
4. [Screen Inventory](#4-screen-inventory)
5. [Screen Specifications — M01 Auth](#5-screen-specifications--m01-auth)
6. [Screen Specifications — M02 Medresa](#6-screen-specifications--m02-medresa)
7. [Screen Specifications — M03 Teacher](#7-screen-specifications--m03-teacher)
8. [Screen Specifications — M04 Course](#8-screen-specifications--m04-course)
9. [Screen Specifications — M05 Student](#9-screen-specifications--m05-student)
10. [Screen Specifications — M06 Attendance](#10-screen-specifications--m06-attendance)
11. [Screen Specifications — M07 Grades](#11-screen-specifications--m07-grades)
12. [Screen Specifications — M08 Fees](#12-screen-specifications--m08-fees)
13. [Screen Specifications — M09 Salary](#13-screen-specifications--m09-salary)
14. [Screen Specifications — M10 Reports](#14-screen-specifications--m10-reports)
15. [Interaction Patterns](#15-interaction-patterns)
16. [Accessibility](#16-accessibility)
17. [Agent Implementation Instructions](#17-agent-implementation-instructions)

---

## 1. Design Philosophy

### Core Principles

**Modern Islamic Aesthetic**
The visual language draws from Islamic geometric tradition — precise hexagonal patterns, interlocking forms, and a sense of mathematical harmony — rendered in a clean, flat, modern style. No kitsch or heavy ornamentation. The patterns are subtle, purposeful accents, not decoration for its own sake.

**Mobile-First**
Teachers take attendance on phones in classrooms. Admins check fee status on the go. Every screen is designed for a 390px viewport first, then scaled up for desktop. Touch targets are minimum 44×44px. No hover-dependent interactions.

**Clarity over density**
Each screen has one primary action. Complex data is chunked into digestible cards. Color is used sparingly to encode meaning, not decoration.

**Community feel**
The system serves a community. Language is warm but professional. Arabic and Amharic are first-class citizens, not afterthoughts. The app opens in English by default but switches instantly and completely — including RTL layout for Arabic.

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors

| Name | Hex | Use |
|------|-----|-----|
| Teal 50 | `#E1F5EE` | Light backgrounds, active state fills |
| Teal 100 | `#9FE1CB` | Borders, dividers, input borders |
| Teal 200 | `#5DCAA5` | Secondary accents |
| **Teal 400** | **`#1D9E75`** | **Primary brand color — buttons, active nav, headers** |
| Teal 600 | `#0F6E56` | Text on light teal backgrounds, labels |
| Teal 800 | `#085041` | Dark headings, section titles |
| Cream | `#FAF7F2` | Page background |
| Cream Dark | `#F0EBE1` | Card backgrounds, dividers |

#### Accent Colors

| Name | Hex | Use |
|------|-----|-----|
| Gold 50 | `#FAEEDA` | Admin badge background |
| Gold 400 | `#EF9F27` | Gold accent, warning states |
| Gold 600 | `#BA7517` | Admin badge text |

#### Semantic Colors

| State | Background | Text | Border | Use |
|-------|-----------|------|--------|-----|
| Success / Paid | `#EAF3DE` | `#3B6D11` | `#C0DD97` | Paid fees, active status |
| Warning / Partial | `#FAEEDA` | `#854F0B` | `#FAC775` | Partial payment, late attendance |
| Danger / Unpaid | `#FCEBEB` | `#A32D2D` | `#F7C1C1` | Unpaid fees, absent, inactive |
| Info / Transfer | `#E6F1FB` | `#185FA5` | `#B5D4F4` | Transferred student, info states |

### 2.2 Typography

| Style | Size | Weight | Use |
|-------|------|--------|-----|
| Page title | 22px | 500 | Main screen titles |
| Section heading | 18px | 500 | Card headers, section names |
| Body | 16px | 400 | Primary content text |
| Secondary | 14px | 400 | Supporting text, labels |
| Caption | 12px | 400 | Timestamps, hints, sub-labels |
| Micro label | 10–11px | 500 | Uppercase section dividers |

**Font stack:** System sans-serif (San Francisco on iOS, Roboto on Android)

**Arabic/Amharic:** Same size scale. Arabic triggers `dir="rtl"` on the root element. Font stack includes Noto Naskh Arabic for Arabic text.

**Uppercase labels:** Used for section dividers only (e.g. "THIS MONTH", "STUDENTS"). Letter-spacing: 0.07em. Color: Teal 600.

### 2.3 Islamic Geometric Pattern

Used as a decorative overlay on:
- All page/screen headers (teal-400 background)
- Login screen header
- Dashboard top bar

**Specification:**
- SVG hexagonal polygon pattern
- White stroke, 0.8px width
- Opacity: 12–15% on teal background
- Positioned: top-right corner of header
- Pattern: nested hexagons + satellite hexagons at corners

```svg
<!-- Standard header pattern -->
<svg width="130" height="110" viewBox="0 0 130 110" aria-hidden="true">
  <g stroke="#fff" stroke-width="0.8" fill="none">
    <polygon points="100,5 120,17 120,41 100,53 80,41 80,17"/>
    <polygon points="100,15 114,23 114,35 100,43 86,35 86,23"/>
    <polygon points="60,30 80,42 80,66 60,78 40,66 40,42"/>
    <polygon points="120,50 140,62 140,86 120,98 100,86 100,62"/>
    <polygon points="20,55 40,67 40,91 20,103 0,91 0,67"/>
  </g>
</svg>
```

### 2.4 Spacing System

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Icon gaps, tight spacing |
| sm | 8px | Between related elements |
| md | 12px | Component internal padding |
| lg | 16px | Section padding, card padding |
| xl | 20px | Page padding |
| xxl | 28px | Section separation |

### 2.5 Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 6px | Buttons, inputs, small chips |
| md | 8–10px | Cards, modals |
| lg | 12px | Page sections, large cards |
| full | 999px | Badges, pills, avatars |

### 2.6 Component Specifications

#### Buttons

```
Primary button:
  background: Teal 400 (#1D9E75)
  color: #ffffff
  border-radius: 8px
  padding: 13px 20px
  font-size: 15px, weight 500
  full-width on mobile

Secondary button:
  background: Teal 50
  color: Teal 600
  border: 0.5px solid Teal 100

Ghost button:
  background: transparent
  color: Teal 600
  border: 0.5px solid Teal 200

Destructive button:
  background: #FCEBEB
  color: #A32D2D
  border: 0.5px solid #F7C1C1

Loading state: spinner replaces icon, button disabled
```

#### Form Inputs

```
Default state:
  background: #ffffff
  border: 0.5px solid Teal 100 (#9FE1CB)
  border-radius: 8px
  padding: 10px 12px
  font-size: 14px
  height: 44px minimum

Focused state:
  border-color: Teal 400
  box-shadow: 0 0 0 3px Teal 50

Error state:
  border-color: #A32D2D
  box-shadow: 0 0 0 3px #FCEBEB
  error message: 12px, #A32D2D, below input

Field label:
  font-size: 11px, weight 500
  color: Teal 600
  text-transform: uppercase
  letter-spacing: 0.06em
  margin-bottom: 4px
```

#### Avatar / Initials Circle

```
Size: 40px × 40px (list), 36px (compact), 56px (detail)
border-radius: 50%
Initials: 2 characters, weight 500, font-size 13px

Color rotation by index:
  0: Teal 50 bg + Teal 600 text
  1: Gold 50 bg + Gold 600 text
  2: #E6F1FB bg + #185FA5 text
  3: #EEEDFE bg + #534AB7 text
  4: #EAF3DE bg + #3B6D11 text
```

#### Badges

```
Padding: 3px 10px
border-radius: 999px (pill)
font-size: 12px, weight 500

Active:      Teal 50 bg, Teal 600 text
Admin:       Gold 50 bg, Gold 600 text
Teacher:     Cream dark bg, gray text
Paid:        #EAF3DE bg, #3B6D11 text
Partial:     Gold 50 bg, Gold 600 text
Unpaid:      #FCEBEB bg, #A32D2D text
Inactive:    #FCEBEB bg, #A32D2D text
Transferred: #E6F1FB bg, #185FA5 text
```

#### List Rows

```
height: minimum 56px
padding: 12px 16px
border-bottom: 0.5px solid Cream Dark
display: flex, align-items: center, gap: 12px

Structure:
  [avatar 40px] [text block flex:1] [badge or chevron]

Text block:
  Primary: 14px, weight 500, text-primary
  Secondary: 12px, weight 400, text-tertiary
```

#### Page Header

```
background: Teal 400 (#1D9E75)
padding: 16px 16px 14px
Geometric SVG pattern: top-right, opacity 0.12

Contents (z-index above pattern):
  - Back button (28px circle, rgba white 0.15)
  - Title: 15px, white, weight 500
  - Subtitle: 11px, rgba white 0.75

On dashboard/home: no back button, shows user greeting
```

#### Bottom Navigation

```
background: #ffffff
border-top: 0.5px solid Cream Dark
height: 60px
padding: 8px 0 6px

5 items (varies by role):
  - Icon: 22px Tabler outline
  - Label: 9px, weight 500
  - Active: Teal 400 color + 4px dot indicator below icon
  - Inactive: #aaa color

Teacher nav:    Home | Students | Attendance | Grades | Profile
Admin nav:      Home | Students | Fees | Reports | Settings
Super Admin nav: Home | Medresas | Teachers | Salary | Reports
```

#### Stat Cards

```
background: #ffffff
border: 0.5px solid Cream Dark (#E0DDD6)
border-radius: 10px
padding: 10px 12px

Label: 10px, color #888, with small Tabler icon
Value: 20px, weight 500, Teal 800
Sub-text: 10px, color #aaa

Accent variant (highlighted):
  background: Teal 50 (#E1F5EE)
  border-color: Teal 100
  value color: Teal 400
```

---

## 3. Layout & Navigation

### 3.1 Mobile App Shell

```
┌─────────────────────────┐
│   Page Header (teal)    │  ← Geometric pattern, role info
├─────────────────────────┤
│                         │
│     Screen Content      │  ← Scrollable, cream background
│                         │
│                         │
├─────────────────────────┤
│   Bottom Navigation     │  ← Fixed, 5 items, role-specific
└─────────────────────────┘
```

### 3.2 Navigation by Role

**Teacher navigation:**
| Tab | Icon | Screens |
|-----|------|---------|
| Home | ti-home | Dashboard |
| Students | ti-users | My class roster |
| Attendance | ti-calendar | Take/view attendance |
| Grades | ti-report | Enter/view grades |
| Profile | ti-user | Own profile |

**Medresa Admin navigation:**
| Tab | Icon | Screens |
|-----|------|---------|
| Home | ti-home | Dashboard |
| Students | ti-users | Student list, enroll, transfer |
| Fees | ti-coins | Fee collection, payments |
| Reports | ti-chart-bar | Medresa reports |
| Settings | ti-settings | Courses, account |

**Super Admin navigation:**
| Tab | Icon | Screens |
|-----|------|---------|
| Home | ti-home | Network dashboard |
| Medresas | ti-building | Medresa list & management |
| Teachers | ti-users | Teacher list & management |
| Salary | ti-wallet | Salary management |
| Reports | ti-chart-bar | Network reports |

### 3.3 Page Transitions

- Push (slide left): navigating deeper (list → detail)
- Pop (slide right): back button
- Modal (slide up): create/edit forms, confirmation dialogs
- Fade: tab switching

### 3.4 Desktop (≥768px)

On larger screens, the bottom nav becomes a left sidebar (240px wide). Content area fills remaining width. Two-column layouts unlock for list + detail panels. The header collapses to a top bar.

---

## 4. Screen Inventory

### Complete screen list (47 screens)

| Screen ID | Name | Role | Module |
|-----------|------|------|--------|
| S01 | Login | All | M01 |
| S02 | Forgot Password | All | M01 |
| S03 | Reset Password | All | M01 |
| S04 | User List | Super Admin | M01 |
| S05 | Create/Edit User | Super Admin | M01 |
| S06 | Own Profile | All | M01 |
| S07 | Medresa List | Super Admin | M02 |
| S08 | Create/Edit Medresa | Super Admin | M02 |
| S09 | Medresa Detail | Super Admin | M02 |
| S10 | Teacher List | Super Admin | M03 |
| S11 | Teacher Detail | Super Admin | M03 |
| S12 | Create/Edit Teacher | Super Admin | M03 |
| S13 | Assign Teacher to Medresa | Super Admin | M03 |
| S14 | Teacher Own Profile | Teacher | M03 |
| S15 | Master Course List | Super Admin | M04 |
| S16 | Create/Edit Course | Super Admin | M04 |
| S17 | Medresa Course List | Medresa Admin | M04 |
| S18 | Assign Teacher to Course | Medresa Admin | M04 |
| S19 | Course Detail | Admin + Teacher | M04 |
| S20 | Student List | Medresa Admin | M05 |
| S21 | Enroll Student | Medresa Admin | M05 |
| S22 | Edit Student | Medresa Admin | M05 |
| S23 | Student Detail | Admin + Teacher | M05 |
| S24 | Assign Student to Course | Medresa Admin | M05 |
| S25 | Transfer Student | Medresa Admin | M05 |
| S26 | Teacher Student List | Teacher | M05 |
| S27 | Take Attendance | Teacher \| Medresa Admin | M06 |
| S28 | Edit Attendance | Teacher \| Medresa Admin | M06 |
| S29 | Attendance History | Teacher \| Medresa Admin | M06 |
| S30 | Student Attendance Detail | Teacher \| Medresa Admin (+ read scope) | M06 |
| S31 | Medresa Attendance Overview | Medresa Admin | M06 |
| S32 | Network Attendance Overview | Super Admin | M06 |
| S33 | Exam Type Management | Super Admin | M07 |
| S34 | Grade Entry | Teacher | M07 |
| S35 | Grade Edit Request | Teacher | M07 |
| S36 | Grade Edit Approval | Admin | M07 |
| S37 | Student Results | Admin + Teacher | M07 |
| S38 | Class Results | Teacher | M07 |
| S39 | Fee Structure | Super Admin | M08 |
| S40 | Fee Collection List | Medresa Admin | M08 |
| S41 | Record Payment | Medresa Admin | M08 |
| S42 | Student Fee History | Medresa Admin | M08 |
| S43 | Salary Rank Management | Super Admin | M09 |
| S44 | Assign Rank to Teacher | Super Admin | M09 |
| S45 | Salary Payment List | Super Admin | M09 |
| S46 | Record Salary Payment | Super Admin | M09 |
| S47 | Reports & Dashboard Exports | All (scoped) | M10 |

---

## 5. Screen Specifications — M01 Auth

### S01 — Login Screen

```
┌─────────────────────────┐
│  [EN] [አማ] [ع]          │  Language switcher (top right)
│                         │
│  [mosque icon]          │
│  HMMS                   │
│  مدرسة الحرري           │  Arabic subtitle
│  ሃረሪ መድረሳ              │  Amharic subtitle
│                         │
│  [Geometric pattern bg] │  Teal 400 header section
├─────────────────────────┤
│  PHONE OR EMAIL         │  Cream background
│  [                    ] │  Input with mail icon
│                         │
│  PASSWORD               │
│  [          ] [eye icon]│
│                         │
│  [Forgot password?]     │  Right-aligned link
│                         │
│  [    Sign in    ]      │  Full-width primary button
│                         │
│  HMMS v1.0              │  Centered caption
└─────────────────────────┘

States:
  Loading: spinner in button, button disabled, inputs disabled
  Error: red border on inputs + error message below
  Success: redirect by role (no visible state change)

Error messages:
  401: "Invalid credentials. Please try again."
  403: "Your account has been deactivated. Contact admin."
  Network: "Connection error. Please try again."
```

### S02 — Forgot Password Screen

```
┌─────────────────────────┐
│  [← Back to login]      │  Teal header, smaller
│  Reset password         │
│  [Geometric pattern]    │
├─────────────────────────┤
│  EMAIL ADDRESS          │
│  [                    ] │
│                         │
│  [   Send reset link  ] │
│                         │
│  ─────── OR ───────     │  After success:
│                         │
│  ✉ Check your inbox     │  Success state (replaces form)
│  If this email is       │
│  registered, a link     │
│  has been sent.         │
│                         │
│  Link expires in 1 hour │
│                         │
│  [   Back to login   ]  │
└─────────────────────────┘
```

### S03 — Reset Password Screen

```
┌─────────────────────────┐
│  Set new password       │  Teal header
│  [Geometric pattern]    │
├─────────────────────────┤
│  NEW PASSWORD           │
│  [          ] [eye icon]│
│  [strength bar ████░]   │  3/4 bars = strong
│                         │
│  CONFIRM PASSWORD       │
│  [          ] [✓]       │  Green check when matching
│                         │
│  [  Set new password  ] │
│                         │
│  Min 8 characters       │
└─────────────────────────┘

Error states:
  Expired token: full-page message with link to /forgot-password
  Used token: full-page message with link to /forgot-password
  Mismatch: red border on confirm field + "Passwords don't match"
  Success: full-page success message + "Sign in" button
```

### S04 — User List (Super Admin)

```
┌─────────────────────────┐
│  Users                  │  Teal header
│  Network · 94 users     │
├─────────────────────────┤
│  [🔍 Search users...]   │
│                         │
│  [All] [Active] [Inactive] │  Filter chips
│                         │
│  [AH] Ustaz Ahmed       │  List row
│       ahmed@gmail.com   │
│       Al-Fath · Admin   │  Badge
│                  [Edit] │
│  ─────────────────────  │
│  [FH] Fatima Hassan     │
│       fatima@gmail.com  │
│       Al-Noor · Teacher │
│                  [Edit] │
│  ─────────────────────  │
│                         │
│  [+] Create user        │  FAB bottom right
└─────────────────────────┘
```

### S05 — Create/Edit User (Super Admin)

```
┌─────────────────────────┐
│  [← Back]               │  Modal / full screen
│  Create user            │
├─────────────────────────┤
│  FULL NAME              │
│  [                    ] │
│                         │
│  PHONE NUMBER           │
│  [+251              ]   │  Ethiopian prefix hint
│                         │
│  EMAIL                  │
│  [                    ] │
│                         │
│  ┌─────────────────────┐│
│  │ ℹ A password reset  ││  Info box
│  │ email will be sent  ││
│  │ automatically.      ││
│  └─────────────────────┘│
│                         │
│  [ Cancel ] [Create user]│
└─────────────────────────┘
```

---

## 6. Screen Specifications — M02 Medresa

### S07 — Medresa List

```
┌─────────────────────────┐
│  Medresas               │  Teal header
│  Network · 24 active    │
├─────────────────────────┤
│  [🔍 Search medresas...]│
│  [All] [Active] [Inactive] │
│                         │
│  [🕌] Al-Fath Medresa   │  Card row
│       Harar Jugol       │
│       86 students · 8T  │  Students + Teachers count
│       ● Active          │
│                    [›]  │
│  ─────────────────────  │
│  [🕌] Al-Noor Medresa   │
│       Aboker District   │
│       64 students · 6T  │
│       ● Active          │
│                    [›]  │
│                         │
│  [+] Add medresa        │  FAB
└─────────────────────────┘
```

### S09 — Medresa Detail

```
┌─────────────────────────┐
│  [← Back]               │
│  Al-Fath Medresa        │
│  Harar Jugol            │
├─────────────────────────┤
│  ┌─────────────────────┐│
│  │ 86       8       4  ││  Stat row
│  │Students Teachers Courses││
│  └─────────────────────┘│
│                         │
│  DETAILS                │
│  📍 Harar Jugol         │
│  📞 +251 92 345 6789    │
│  ● Active since 2023    │
│                         │
│  TEACHERS               │
│  [AH] Ustaz Ahmed · Admin│
│  [FH] Fatima · Teacher  │
│  View all 8 →           │
│                         │
│  [Edit] [Deactivate]    │
└─────────────────────────┘
```

---

## 7. Screen Specifications — M03 Teacher

### S10 — Teacher List

```
┌─────────────────────────┐
│  Teachers               │  Teal header
│  Network · 94 teachers  │
├─────────────────────────┤
│  [🔍 Search teachers...]│
│  [All] [Admin] [Quran] [Arabic] │
│                         │
│  [AH] Ustaz Ahmed Hassan│
│       Quran Recitation  │
│       Al-Fath · Al-Noor │  Assigned medresas
│       [Admin] [Teacher] │  Role badges
│                    [›]  │
│  ─────────────────────  │
│  [FM] Fatima Mohammed   │
│       Arabic Language   │
│       Al-Rashid         │
│       [Teacher]         │
│                    [›]  │
│                         │
│  [+] Add teacher        │
└─────────────────────────┘
```

### S11 — Teacher Detail

```
┌─────────────────────────┐
│  [← Back]               │
│  Ustaz Ahmed Hassan     │
│  Quran · Since Jan 2022 │
├─────────────────────────┤
│  [Photo or initials AH] │  56px avatar, centered
│                         │
│  📞 +251 91 234 5678    │
│  ✉  ahmed@gmail.com     │
│  ● Active               │
│                         │
│  MEDRESA ASSIGNMENTS    │
│  ┌─────────────────────┐│
│  │ Al-Fath    [Admin]  ││
│  │ Since Jan 2022      ││
│  ├─────────────────────┤│
│  │ Al-Noor    [Teacher]││
│  │ Since Mar 2023      ││
│  └─────────────────────┘│
│                         │
│  SALARY RANK             │  Super Admin only
│  Rank 3 · 3,500 ETB/mo  │
│                         │
│  [Edit] [Assign medresa]│
└─────────────────────────┘
```

---

## 8. Screen Specifications — M04 Course

### S17 — Medresa Course List (Admin)

```
┌─────────────────────────┐
│  [← Back]               │
│  Courses                │
│  Al-Fath · 4 active     │
├─────────────────────────┤
│  [+ Activate course]    │  Secondary button
│                         │
│  [📖] Quran Recitation  │  Course card
│       Beginner          │
│       Ustaz Ahmed       │  Assigned teacher
│       17 students       │
│                    [›]  │
│  ─────────────────────  │
│  [📖] Arabic Language   │
│       Intermediate      │
│       Fatima Mohammed   │
│       12 students       │
│                    [›]  │
│  ─────────────────────  │
│  [📖] Fiqh              │
│       Advanced          │
│       ⚠ No teacher      │  Warning state
│       8 students        │
│                    [›]  │
└─────────────────────────┘
```

---

## 9. Screen Specifications — M05 Student

### S20 — Student List

```
┌─────────────────────────┐
│  Students               │
│  Al-Fath · 86 enrolled  │
├─────────────────────────┤
│  [🔍 Search students...]│
│  [All] [Quran] [Arabic] [Fiqh] │
│                         │
│  [YA] Yusuf Ali         │
│       Quran, Arabic     │
│       Guardian: Ali Hassan│
│       ● Active          │  Status badge
│                    [›]  │
│  [MH] Mariam Hassan     │
│       Quran             │
│       Guardian: Hassan M│
│       ● Active          │
│                    [›]  │
│                         │
│  [+ Enroll student]     │  FAB
└─────────────────────────┘
```

### S23 — Student Detail

```
┌─────────────────────────┐
│  [← Back]               │
│  Yusuf Ali              │
│  Al-Fath Medresa        │
├─────────────────────────┤
│  [Photo or YA avatar]   │  56px, centered
│                         │
│  📅 Born: 15 Meskerem 2010│  Ethiopian date
│  ♂ Male                 │
│  📍 Harar Jugol         │
│                         │
│  GUARDIAN               │
│  Ali Hassan             │
│  📞 +251 91 234 5678    │
│                         │
│  COURSES (2)            │
│  • Quran Recitation     │
│  • Arabic Language      │
│                         │
│  FEES                   │
│  ✓ Paid · 50 ETB        │  This month
│  Balance: 0 ETB         │
│                         │
│  ATTENDANCE             │
│  92% this month         │
│                         │
│  [Edit] [Transfer]      │
└─────────────────────────┘
```

### S25 — Transfer Student

```
┌─────────────────────────┐
│  [← Back]               │
│  Transfer student       │
│  Yusuf Ali              │
├─────────────────────────┤
│  FROM                   │
│  Al-Fath Medresa        │  Read only
│                         │
│  TO MEDRESA             │
│  [Select medresa...  ▼] │
│                         │
│  TRANSFER DATE          │
│  [15 Meskerem 2017   ]  │  Ethiopian date picker
│                         │
│  REASON (optional)      │
│  [                    ] │
│  [                    ] │
│                         │
│  ┌─────────────────────┐│
│  │ ⚠ The destination   ││
│  │ admin must re-assign││
│  │ courses manually.   ││
│  └─────────────────────┘│
│                         │
│  [Cancel] [Transfer]    │
└─────────────────────────┘
```

---

## 10. Screen Specifications — M06 Attendance

**Shared daily roll:** One roster per medresa per day (all active students). Same screen component for ustaz and Amir; routes differ by role.

| Screen | Teacher route | Medresa Admin route |
|--------|---------------|---------------------|
| S27 Take | `/teacher/attendance/take?medresaId=` | `/medresa/attendance/take?medresaId=` |
| S28 Edit | Same as S27 when session exists | Same as S27 when session exists |
| S29 Hub | `/teacher/attendance` | `/medresa/attendance` |
| S31 Overview | — | `/medresa/attendance` (date picker + totals) |

**Markers:** Show `teacher_marked_at` and `admin_marked_at` as localized times (Ethiopia). Amir sees a soft warning if the teacher already saved today’s roll.

### S27 — Take Attendance (Teacher \| Medresa Admin)

```
┌─────────────────────────┐
│  [← Back]               │
│  Attendance             │
│  Today · 17 students    │  Medresa-wide daily roll
│  Teacher: 08:12 · Amir: not yet │  Marker strip (times when set)
│  ┌─────────────────────┐│
│  │14 Present│2 Absent  ││  Summary bar
│  │1 Late    │17 Total  ││
│  └─────────────────────┘│
├─────────────────────────┤
│  [YA] Yusuf Ali         │
│       [P✓] [A] [L] [E] │  P=Present A=Absent L=Late E=Excused
│  ─────────────────────  │
│  ...                    │
├─────────────────────────┤
│  [   Submit attendance  ]│  Fixed submit bar
└─────────────────────────┘

Button states:
  Default: outlined, light color
  Selected: filled background, bold text
  P selected: Teal 50 bg + Teal 600 text
  A selected: #FCEBEB bg + #A32D2D text
  L selected: Gold 50 bg + Gold 600 text
  E selected: #E6F1FB bg + #185FA5 text

After submit:
  Lock icon appears on header (when day locked)
  Marker strip shows last save time per role
  Edit available same day until midnight lock
```

### S28 — Edit Attendance (same day)

```
Same layout as S27 but:
  Header shows: "Edit Attendance · Submitted 08:45"
  Warning banner: "Changes locked after midnight"
  Amir-only banner (if teacher_marked_at set): prefer corrections only
  Submit becomes: "Save changes"
  All records pre-filled with submitted values
```

---

## 11. Screen Specifications — M07 Grades

### S34 — Grade Entry

```
┌─────────────────────────┐
│  [← Back]               │
│  Enter grades           │
│  Midterm Exam · Quran   │
│  Max: 100 · Weight: 40% │
├─────────────────────────┤
│  STUDENT          SCORE │
│  [YA] Yusuf Ali    [92] │  [A] auto letter
│  [MH] Mariam       [75] │  [C]
│  [OA] Omar         [84] │  [B]
│  [FA] Fatuma       [  ] │  [?] not entered yet
│  ─────────────────────  │
│  ... 13 more            │
├─────────────────────────┤
│  [Save grades (3/17)]   │  Shows progress
└─────────────────────────┘

Score input:
  Width: 44px, center-aligned
  Max value enforced (cannot exceed exam max_score)
  On blur: auto-calculate letter grade
  Letter grade display:
    A: Teal 50 bg
    B: Gold 50 bg
    C: #E6F1FB bg
    D: #FAEEDA bg
    F: #FCEBEB bg
```

### S36 — Grade Edit Approval

```
┌─────────────────────────┐
│  Grade Edit Requests    │
│  3 pending              │
├─────────────────────────┤
│  Ustaz Ahmed            │  Teacher name
│  Yusuf Ali · Quran      │  Student · Course
│  Midterm: 75 → 82       │  Current → Requested
│  "Data entry error"     │  Reason
│  [Reject] [Approve]     │
│  ─────────────────────  │
│  Fatima Mohammed        │
│  Omar A. · Arabic       │
│  Final: 58 → 65         │
│  "Rechecked paper"      │
│  [Reject] [Approve]     │
└─────────────────────────┘

On Reject:
  Modal asking for rejection reason (required)
```

---

## 12. Screen Specifications — M08 Fees

### S40 — Fee Collection List

```
┌─────────────────────────┐
│  Fee Collection         │
│  Al-Fath · Meskerem 2017│  Ethiopian month/year
├─────────────────────────┤
│  ┌──────────┬──────────┐│
│  │ Collected│Outstanding││  Summary
│  │ 4,300 ETB│ 1,200 ETB││
│  └──────────┴──────────┘│
│                         │
│  [All] [Unpaid] [Partial]│  Filter chips
│                         │
│  [YA] Yusuf Ali         │
│       50 ETB due        │
│              [Paid ✓]   │
│  ─────────────────────  │
│  [MH] Mariam Hassan     │
│       50 ETB due        │
│       25 paid, 25 owed  │
│              [Partial]  │
│  ─────────────────────  │
│  [OA] Omar Abdullahi    │
│       50 ETB due        │
│              [Unpaid]   │
│              [+ Record] │
└─────────────────────────┘
```

### S41 — Record Payment

```
┌─────────────────────────┐
│  [← Back]               │
│  Record payment         │
│  Omar Abdullahi         │
├─────────────────────────┤
│  MONTH                  │
│  [Meskerem 2017      ▼] │  Ethiopian month picker
│                         │
│  AMOUNT DUE             │
│  50 ETB                 │  Read only
│                         │
│  AMOUNT PAID            │
│  [                    ] │  ETB input
│                         │
│  PAYMENT METHOD         │
│  [● Cash  ○ Bank transfer]│  Radio
│                         │
│  BANK REFERENCE         │  Shown only if Bank transfer
│  [                    ] │
│                         │
│  PAYMENT DATE           │
│  [10 Meskerem 2017   ]  │  Ethiopian date, default today
│                         │
│  NOTE (optional)        │
│  [                    ] │
│                         │
│  [  Record payment    ] │
└─────────────────────────┘
```

---

## 13. Screen Specifications — M09 Salary

### S45 — Salary Payment List

```
┌─────────────────────────┐
│  Salary Management      │
│  Meskerem 2017          │
├─────────────────────────┤
│  ┌────────────────────┐ │
│  │ Disbursed  Unpaid  │ │
│  │ 47,000 ETB    7    │ │
│  └────────────────────┘ │
│                         │
│  ⚠ 7 teachers unpaid    │  Warning banner if unpaid
│                         │
│  [All] [Paid] [Unpaid]  │
│  [Rank 1] [Rank 2] [Rank 3]│
│                         │
│  [AH] Ustaz Ahmed       │
│       Rank 3 · 3,500 ETB│
│              [Paid ✓]   │
│  ─────────────────────  │
│  [FM] Fatima Mohammed   │
│       Rank 2 · 2,500 ETB│
│              [Unpaid]   │
│              [+ Pay]    │
└─────────────────────────┘
```

### S46 — Record Salary Payment

```
┌─────────────────────────┐
│  [← Back]               │
│  Record salary          │
│  Ustaz Ahmed Hassan     │
├─────────────────────────┤
│  MONTH                  │
│  [Meskerem 2017      ▼] │
│                         │
│  RANK                   │
│  Rank 3 (Senior)        │  Read only
│                         │
│  AMOUNT                 │
│  [3,500 ETB            ]│  Pre-filled from rank, editable
│                         │
│  ┌─────────────────────┐│  If amount edited:
│  │ ⚠ This differs from ││
│  │ the rank amount.    ││
│  │ Please add a reason.││
│  └─────────────────────┘│
│                         │
│  ADJUSTMENT REASON      │  Required if adjusted
│  [                    ] │
│                         │
│  BANK REFERENCE         │
│  [                    ] │  Always required
│                         │
│  PAYMENT DATE           │
│  [10 Meskerem 2017   ]  │
│                         │
│  [  Record payment    ] │
└─────────────────────────┘
```

---

## 14. Screen Specifications — M10 Reports

### S47 — Reports Home

```
┌─────────────────────────┐
│  Reports                │
│  Ethiopian year 2017    │
├─────────────────────────┤
│  EXPORT REPORTS         │
│                         │
│  [📊] Student Enrollment│  Report card
│       Filter by medresa │
│       PDF · Excel       │
│                    [›]  │
│  ─────────────────────  │
│  [📅] Attendance Report │
│       Filter by course  │
│       PDF · Excel       │
│                    [›]  │
│  ─────────────────────  │
│  [💰] Fee Collection    │
│       Filter by month   │
│       PDF · Excel       │
│                    [›]  │
│  ─────────────────────  │
│  [📝] Grades & Results  │
│       Filter by exam    │
│       PDF · Excel       │
│                    [›]  │
│  ─────────────────────  │
│  [💼] Salary Report     │  Super Admin only
│       Filter by rank    │
│       PDF · Excel       │
│                    [›]  │
└─────────────────────────┘
```

---

## 15. Interaction Patterns

### 15.1 Ethiopian Date Picker

```
Display format: "10 Meskerem 2017" (Day Month Year)
Month names (Amharic): Meskerem, Tikimt, Hidar, Tahsas,
  Tir, Yekatit, Megabit, Miazia, Genbot, Sene, Hamle,
  Nehase, Pagume
Picker: scroll wheel or calendar grid
Always convert to Gregorian before API call
```

### 15.2 Confirmation Dialogs

```
Triggered by: Deactivate, Transfer, Delete actions

Structure:
  Title: "Deactivate [Name]?" (always a question)
  Body: consequence explanation (what happens)
  Note: what is preserved
  Buttons: [Cancel] [Confirm — red or teal]

Example:
  "Deactivate Al-Fath Medresa?"
  "This medresa will be hidden from the network.
   All student and teacher data will be preserved."
  [Cancel] [Deactivate]
```

### 15.3 Toast Notifications

```
Position: top center, below header
Duration: 3 seconds, then fade
Types:
  Success: Teal 50 bg + Teal 800 text + check icon
  Error: #FCEBEB bg + #A32D2D text + x icon
  Info: #E6F1FB bg + #185FA5 text + info icon
  Warning: Gold 50 bg + Gold 600 text + warning icon

Examples:
  "User created. Reset email sent."
  "Grade saved successfully."
  "Payment recorded."
  "Attendance submitted."
```

### 15.4 Empty States

```
Every list screen must have an empty state:
  - Illustrated icon (Tabler, 48px, Teal 100)
  - Title: what's empty
  - Subtitle: action to take
  - CTA button (when applicable)

Examples:
  No students: "No students enrolled"
               "Enroll the first student"
               [+ Enroll student]

  No attendance: "No attendance today"
                 "Take today's attendance"
                 [Take attendance]
```

### 15.5 Pull-to-Refresh

All list screens support pull-to-refresh gesture.
Triggers a TanStack Query refetch.
Show teal spinner during refresh.

### 15.6 Loading States

```
List screens: skeleton rows (3–5 gray placeholder rows)
Detail screens: skeleton card
Buttons: spinner replaces icon, button disabled
Stat cards: gray shimmer placeholder
```

### 15.7 RTL (Arabic) Mode

When Arabic language selected:
- `document.dir = "rtl"` applied to root
- All flex rows reverse (start ↔ end)
- Icons remain same orientation (except arrows)
- Text alignment flips
- Back arrow points right (←  becomes →)
- Form labels align right
- Navigation order visually reversed

---

## 16. Accessibility

### Minimum requirements

- All touch targets: minimum 44×44px
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text
- All icons have `aria-hidden="true"` or `aria-label`
- All images have `alt` text
- Form inputs have associated `<label>` elements
- Error messages linked to inputs via `aria-describedby`
- Loading states announced via `aria-live="polite"`
- Modals trap focus while open
- All screens navigable via keyboard (desktop)

### Screen reader support

- Page titles update on navigation
- Lists use `<ul>` / `<li>` semantics
- Tables use `<th>` headers
- Status badges include text (not color only)

---

## 17. Agent Implementation Instructions

### CSS Variables to Define

```css
:root {
  /* Brand */
  --hmms-teal-50:  #E1F5EE;
  --hmms-teal-100: #9FE1CB;
  --hmms-teal-200: #5DCAA5;
  --hmms-teal-400: #1D9E75;
  --hmms-teal-600: #0F6E56;
  --hmms-teal-800: #085041;

  /* Backgrounds */
  --hmms-cream:      #FAF7F2;
  --hmms-cream-dark: #F0EBE1;

  /* Accent */
  --hmms-gold-50:  #FAEEDA;
  --hmms-gold-400: #EF9F27;
  --hmms-gold-600: #BA7517;

  /* Semantic */
  --hmms-success-bg:   #EAF3DE;
  --hmms-success-text: #3B6D11;
  --hmms-warning-bg:   #FAEEDA;
  --hmms-warning-text: #854F0B;
  --hmms-danger-bg:    #FCEBEB;
  --hmms-danger-text:  #A32D2D;
  --hmms-info-bg:      #E6F1FB;
  --hmms-info-text:    #185FA5;

  /* Spacing */
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 12px;
  --sp-lg: 16px;
  --sp-xl: 20px;

  /* Radius */
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;
  --r-full: 999px;
}
```

### Tailwind Config Additions

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          dark: '#F0EBE1',
        },
        gold: {
          50:  '#FAEEDA',
          400: '#EF9F27',
          600: '#BA7517',
        }
      },
      fontFamily: {
        arabic: ['Noto Naskh Arabic', 'serif'],
      }
    }
  }
}
```

### Shadcn/ui Component Overrides

```javascript
// components.json theme overrides
{
  "primary": "hsl(161, 69%, 36%)",        // Teal 400
  "primary-foreground": "hsl(0, 0%, 100%)",
  "secondary": "hsl(152, 53%, 95%)",       // Teal 50
  "secondary-foreground": "hsl(162, 73%, 24%)", // Teal 600
  "background": "hsl(40, 43%, 97%)",       // Cream
  "muted": "hsl(38, 32%, 91%)",           // Cream dark
  "destructive": "hsl(0, 57%, 40%)",      // Danger
  "border": "hsl(161, 33%, 85%)"          // Teal 100
}
```

### i18next Namespace Structure

```javascript
// locales/en/translation.json
{
  "app": { "name": "HMMS", "tagline": "Harari Medresa Management" },
  "auth": { "login": "Sign in", "logout": "Sign out", ... },
  "nav": { "home": "Home", "students": "Students", ... },
  "students": { "title": "Students", "enroll": "Enroll student", ... },
  "attendance": { "present": "Present", "absent": "Absent", ... },
  "fees": { "collected": "Collected", "outstanding": "Outstanding", ... },
  "months": { "meskerem": "Meskerem", "tikimt": "Tikimt", ... }
}

// locales/am/translation.json — Amharic
// locales/ar/translation.json — Arabic (triggers RTL)
```

### PWA Manifest

```json
{
  "name": "HMMS - Harari Medresa Management",
  "short_name": "HMMS",
  "description": "مدرسة الحرري · ሃረሪ መድረሳ",
  "theme_color": "#1D9E75",
  "background_color": "#FAF7F2",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Geometric Pattern Component

```tsx
// components/GeometricPattern.tsx
export const GeometricPattern = ({ opacity = 0.12 }: { opacity?: number }) => (
  <svg
    width="130" height="110"
    viewBox="0 0 130 110"
    aria-hidden="true"
    style={{
      position: 'absolute', top: 0, right: 0,
      opacity, pointerEvents: 'none'
    }}
  >
    <g stroke="#fff" strokeWidth="0.8" fill="none">
      <polygon points="100,5 120,17 120,41 100,53 80,41 80,17"/>
      <polygon points="100,15 114,23 114,35 100,43 86,35 86,23"/>
      <polygon points="60,30 80,42 80,66 60,78 40,66 40,42"/>
      <polygon points="120,50 140,62 140,86 120,98 100,86 100,62"/>
      <polygon points="20,55 40,67 40,91 20,103 0,91 0,67"/>
    </g>
  </svg>
);
```

### PageHeader Component

```tsx
// components/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode; // for dashboard stats row
}

export const PageHeader = ({ title, subtitle, onBack, rightAction, children }: PageHeaderProps) => (
  <div style={{ background: '#1D9E75', padding: '16px', position: 'relative', overflow: 'hidden' }}>
    <GeometricPattern />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && <BackButton onClick={onBack} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 15, fontWeight: 500, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  </div>
);
```

---

*HMMS UI/UX Specification v1.0*
*Style: Modern Islamic · Palette: Teal + Cream · Platform: Mobile-first PWA*
*47 screens across 10 modules*
