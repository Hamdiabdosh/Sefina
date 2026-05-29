import { z } from "zod";

export const localizedStringSchema = z.object({
  en: z.string().min(1, "English text is required"),
  am: z.string().optional(),
  ar: z.string().optional(),
});
