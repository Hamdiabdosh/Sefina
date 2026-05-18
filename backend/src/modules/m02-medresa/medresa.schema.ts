import { z } from "zod";

export const createMedresaSchema = z.object({
  name: z.string().min(1, "Medresa name is required"),
  location: z.string().min(1, "Location is required"),
  phone: z.string().optional().nullable(),
});

export const updateMedresaSchema = z.object({
  name: z.string().min(1, "Medresa name is required").optional(),
  location: z.string().min(1, "Location is required").optional(),
  phone: z.string().optional().nullable(),
});