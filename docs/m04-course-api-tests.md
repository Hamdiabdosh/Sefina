# M04 Course API — Manual test matrix

Run with a valid Super Admin token (`TOKEN`) and medresa/teacher IDs from your dev seed.

```bash
BASE=http://localhost:3000/api/v1
TOKEN="<super_admin_jwt>"
MEDRESA_ID="<medresa_uuid>"
TEACHER_ID="<teacher_in_medresa_uuid>"
OTHER_MEDRESA="<other_medresa_uuid>"
```

| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | Create unique course | `POST $BASE/courses` with name.en | 201 |
| 2 | Duplicate name | Same name.en again | 409 `DUPLICATE_COURSE_NAME` |
| 3 | List courses | `GET $BASE/courses` | 200 + pagination |
| 4 | Activate in medresa | `POST $BASE/medresas/$MEDRESA_ID/courses` `{courseId}` | 201 |
| 5 | Cross-medresa admin | Medresa Admin token for medresa A calls medresa B courses | 403 |
| 6 | Teacher not in medresa | Assign teacher not in medresa | 400 `TEACHER_NOT_IN_MEDRESA` |
| 7 | Assign valid teacher | `POST .../teacher` `{teacherId}` | 201 |
| 8 | Deactivate master | `PATCH $BASE/courses/:id/deactivate` | 200; excluded from `/available` |
| 9 | Deactivate medresa course | `PATCH .../medresaCourseId/deactivate` | 200; other medresas unchanged |

Dependency: M03 `TeacherMedresa` assignment must exist before step 7.
