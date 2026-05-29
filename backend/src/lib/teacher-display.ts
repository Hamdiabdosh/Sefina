/** Prisma select fragment for teacher display name/email from User (source of truth). */
export const teacherUserIdentitySelect = {
  id: true,
  user: { select: { full_name: true, email: true } },
} as const;

export const teacherUserNameSelect = {
  id: true,
  user: { select: { full_name: true } },
} as const;

export const teacherUserNamePhotoSelect = {
  id: true,
  photo_url: true,
  user: { select: { full_name: true } },
} as const;
