import cron from "node-cron";
import {
  ethiopianMonthCompare,
  getEthiopianToday,
} from "../lib/ethiopian-calendar";
import { ETHIOPIA_TZ } from "../lib/ethiopia-time";
import { countUnpaidTeachersForMonth } from "../modules/m09-salaries/salary-ledger.service";

/** Previous Ethiopian month relative to ref (default today). */
export const previousEthiopianMonth = (
  ref = getEthiopianToday()
): { month: number; year: number } => {
  if (ref.month === 1) return { month: 13, year: ref.year - 1 };
  return { month: ref.month - 1, year: ref.year };
};

export const runSalaryUnpaidCheck = async (): Promise<number> => {
  const prev = previousEthiopianMonth();
  const unpaid = await countUnpaidTeachersForMonth(prev.month, prev.year);
  const today = getEthiopianToday();
  if (ethiopianMonthCompare(prev, today) >= 0) {
    console.warn("[salary-cron] Previous month is not before current month; skipped");
    return 0;
  }
  console.log(
    `[salary-cron] Ethiopian ${prev.month}/${prev.year}: ${unpaid} active teacher(s) without salary payment`
  );
  return unpaid;
};

export const scheduleSalaryCron = (): void => {
  cron.schedule(
    "0 6 1 * *",
    () => {
      void runSalaryUnpaidCheck().catch((e: unknown) =>
        console.error("[salary-cron]", e)
      );
    },
    { timezone: ETHIOPIA_TZ }
  );
};
