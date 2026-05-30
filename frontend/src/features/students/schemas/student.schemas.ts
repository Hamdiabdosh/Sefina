import { z } from 'zod';

const ethiopianPhoneRegex = /^(?:\+2519|09)\d{8}$/;

export const studentFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  fullNameAm: z.string().max(200).optional(),
  fullNameAr: z.string().max(200).optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  address: z.string().min(1, 'Address is required'),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z
    .string()
    .regex(ethiopianPhoneRegex, 'Phone must be Ethiopian format (09XXXXXXXX or +2519XXXXXXXX)'),
});

export const transferFormSchema = z.object({
  toMedresaId: z.string().uuid('Select a destination medresa'),
  transferDate: z.string().min(1, 'Transfer date is required'),
  reason: z.string().max(500).optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const toStudentFormData = (values: StudentFormValues, photo?: File | null): FormData => {
  const form = new FormData();
  form.append('fullName', values.fullName);
  if (values.fullNameAm) form.append('fullNameAm', values.fullNameAm);
  if (values.fullNameAr) form.append('fullNameAr', values.fullNameAr);
  form.append('dateOfBirth', values.dateOfBirth);
  form.append('gender', values.gender);
  form.append('address', values.address);
  form.append('guardianName', values.guardianName);
  form.append('guardianPhone', values.guardianPhone);
  if (photo) form.append('photo', photo);
  return form;
};

export const getStudentMutationError = (error: unknown): string | null => {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return res?.data?.error?.message ?? null;
  }
  return null;
};
