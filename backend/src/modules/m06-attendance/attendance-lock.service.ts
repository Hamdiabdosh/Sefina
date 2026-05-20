import { prisma } from "../../lib/prisma";
import {
  dateToCalendarEt,
  getCalendarDateEt,
  getYesterdayCalendarDateEt,
  prismaDateFromCalendarYmd,
} from "../../lib/ethiopia-time";

/** Lock all sessions strictly before Ethiopia “today”. */
export async function lockStaleAttendanceSessions(): Promise<number> {
  const todayEt = getCalendarDateEt();
  const open = await prisma.attendanceSession.findMany({
    where: { deleted_at: null, is_locked: false },
    select: { id: true, date: true },
  });
  const ids = open.filter((s) => dateToCalendarEt(s.date) < todayEt).map((s) => s.id);
  if (ids.length === 0) return 0;
  const res = await prisma.attendanceSession.updateMany({
    where: { id: { in: ids } },
    data: { is_locked: true },
  });
  return res.count;
}

/** Midnight job: sessions for Ethiopian calendar yesterday. */
export async function lockYesterdayAttendanceSessions(): Promise<number> {
  const y = getYesterdayCalendarDateEt();
  const d = prismaDateFromCalendarYmd(y);
  const res = await prisma.attendanceSession.updateMany({
    where: { date: d, deleted_at: null, is_locked: false },
    data: { is_locked: true },
  });
  return res.count;
}
