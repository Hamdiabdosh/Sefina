import { useTranslation } from "react-i18next";
import { formatMarkerTimeEt } from "../utils/formatMarkerTime";

type AttendanceMarkerStripProps = {
  teacherMarkedAt: string | null | undefined;
  adminMarkedAt: string | null | undefined;
  className?: string;
};

export const AttendanceMarkerStrip = ({
  teacherMarkedAt,
  adminMarkedAt,
  className = "",
}: AttendanceMarkerStripProps) => {
  const { t } = useTranslation();
  const teacherTime = formatMarkerTimeEt(teacherMarkedAt);
  const adminTime = formatMarkerTimeEt(adminMarkedAt);

  return (
    <p
      className={`text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 ${className}`.trim()}
    >
      <span>
        {t("attendance.markerTeacher")}:{" "}
        {teacherTime ? t("attendance.markerAt", { time: teacherTime }) : t("attendance.markerPending")}
      </span>
      <span>
        {t("attendance.markerAmir")}:{" "}
        {adminTime ? t("attendance.markerAt", { time: adminTime }) : t("attendance.markerPending")}
      </span>
    </p>
  );
};
