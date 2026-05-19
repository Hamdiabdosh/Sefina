import { z } from 'zod';

export const medresaFormSchema = z.object({
  name: z.string().min(1, 'Medresa name is required'),
  location: z.string().min(1, 'Location is required'),
  phone: z.string().optional(),
});

export type MedresaFormValues = z.infer<typeof medresaFormSchema>;

export type MedresaApiPayload = {
  name: string;
  location: string;
  phone?: string | null;
};

export const toMedresaApiPayload = (data: MedresaFormValues): MedresaApiPayload => ({
  name: data.name.trim(),
  location: data.location.trim(),
  phone: data.phone?.trim() ? data.phone.trim() : null,
});

export const getMedresaMutationError = (error: unknown): string | null => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = error.response.data as { error?: { code?: string; message?: string } };
    if (data.error?.code === 'MEDRESA_NAME_EXISTS') {
      return 'A medresa with this name already exists.';
    }
    if (data.error?.message) {
      return data.error.message;
    }
  }
  return null;
};
