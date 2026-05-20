import cron from "node-cron";
import {
  lockStaleAttendanceSessions,
  lockYesterdayAttendanceSessions,
} from "../modules/m06-attendance/attendance-lock.service";
import { ETHIOPIA_TZ } from "../lib/ethiopia-time";

export const scheduleAttendanceCron = (): void => {
  cron.schedule(
    "0 0 * * *",
    () => {
      void lockYesterdayAttendanceSessions()
        .then((n) =>
          console.log(`[attendance-lock] Locked ${n} yesterday session(s)`)
        )
        .catch((e: unknown) => console.error("[attendance-lock]", e));
      void lockStaleAttendanceSessions()
        .then((n) =>
          console.log(`[attendance-lock] Locked ${n} stale session(s)`)
        )
        .catch((e: unknown) => console.error("[attendance-stale-lock]", e));
    },
    { timezone: ETHIOPIA_TZ }
  );

  void lockStaleAttendanceSessions()
    .then((n) => {
      if (n > 0) console.log(`[attendance-lock] Startup: locked ${n} stale session(s)`);
    })
    .catch((e: unknown) => console.error("[attendance-stale-lock] startup", e));
};
