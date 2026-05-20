export const centsToEtb = (cents: number): number => Math.round(cents) / 100;

export const pickLocalizedName = (name: unknown): string => {
  if (name && typeof name === "object" && "en" in name) {
    const en = (name as { en?: string }).en;
    return typeof en === "string" ? en : "—";
  }
  return "—";
};
