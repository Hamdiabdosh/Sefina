import { z } from "zod";

/** Ethiopian mobile: 09XXXXXXXX or +2519XXXXXXXX */
export const ethiopianPhoneSchema = z
  .string()
  .regex(
    /^(?:\+2519|09)\d{8}$/,
    "Phone must be Ethiopian format (09XXXXXXXX or +2519XXXXXXXX)"
  );

export const emailSchema = z.string().email("Invalid email address");

export const identifierSchema = z
  .string()
  .min(3)
  .refine(
    (value) => {
      const emailOk = z.string().email().safeParse(value).success;
      const phoneOk = ethiopianPhoneSchema.safeParse(value).success;
      return emailOk || phoneOk;
    },
    { message: "Must be a valid email or Ethiopian phone number" }
  );
