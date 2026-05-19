import type { TFunction } from 'i18next';

export type MedresaRoleCode = 'TEACHER' | 'ADMIN';

export const getMedresaRoleLabel = (role: MedresaRoleCode, t: TFunction): string =>
  role === 'ADMIN' ? t('roles.amir') : t('roles.teacher');
