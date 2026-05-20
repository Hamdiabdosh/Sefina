/** Calendar `YYYY-MM-DD` in Africa/Addis_Ababa (Gregorian). */
export function getTodayCalendarEt(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
