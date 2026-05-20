# M05 Student API — Manual test matrix

## Automated checklist (recommended)

Uses four seeded accounts (`admin01`, `admin02@sefinet.dev`, `ustaz06`, `ustaz07`; password `Teacher@12345`). Creates a disposable student, runs the scenarios below (including activating **Islamic Studies** on admin01’s medresa without a teacher when needed), then transfers the student away and **back** to leave the roster unchanged apart from one extra inactive course slot.

```bash
make dev-verify-m05
# or: ./scripts/verify-m05-student-api.sh
```

**Auth note:** `/auth/login` is rate-limited (10 attempts / 15 min). If you hit `RATE_LIMITED`, wait or restart the backend container.

---

## Manual runs

Run with valid tokens and IDs from your dev seed.

```bash
BASE=http://localhost:4000/api/v1
ADMIN_TOKEN="<medresa_admin_jwt>"
TEACHER_TOKEN="<teacher_jwt>"
MEDRESA_ID="<medresa_uuid>"
OTHER_MEDRESA="<other_medresa_uuid>"
MEDRESA_COURSE_ID="<active_course_with_teacher>"
MEDRESA_COURSE_NO_TEACHER="<active_course_without_teacher>"
STUDENT_ID="<student_uuid>"
```

| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | Enroll student | `POST $BASE/medresas/$MEDRESA_ID/students` JSON body | 201, `enrolledAt` set |
| 2 | Invalid photo | `POST` multipart with `photo` = PDF | 400 `INVALID_PHOTO` |
| 3 | List students | `GET $BASE/medresas/$MEDRESA_ID/students` | 200 + pagination |
| 4 | Cross-medresa list | Medresa Admin A token on medresa B | 403 |
| 5 | Assign with teacher | `POST $BASE/students/$STUDENT_ID/courses` `{medresaCourseId}` | 201 |
| 6 | Assign without teacher | Use course with no assignment | 400 `COURSE_NO_TEACHER` |
| 7 | Wrong medresa course | Course from another medresa | 404/400 |
| 8 | Transfer | `POST $BASE/students/$STUDENT_ID/transfer` | 200, `StudentTransfer` row |
| 9 | Teacher detail OK | Teacher token `GET $BASE/students/$STUDENT_ID` for roster student | 200 |
| 10 | Teacher foreign student | Teacher token on student not in their courses | 403 |
| 11 | Remove enrollment | `DELETE .../courses/:studentCourseId` | 200, soft deleted |
| 12 | Transfer destinations | `GET $BASE/students/transfer-destinations?excludeMedresaId=$MEDRESA_ID` | 200 active medresas |

Dependency: M04 course must be active with teacher assigned before test 5.
