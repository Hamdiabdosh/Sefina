/** Localized time in Africa/Addis_Ababa for attendance marker timestamps. */
export function formatMarkerTimeEt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "Africa/Addis_Ababa",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
