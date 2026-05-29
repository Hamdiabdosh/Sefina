/** UI spec avatar palette (5-way rotation). */
export const AVATAR_COLOR_CLASSES = [
  'bg-teal-50 text-teal-600',
  'bg-gold-50 text-gold-600',
  'bg-[#E6F1FB] text-[#185FA5]',
  'bg-[#EEEDFE] text-[#534AB7]',
  'bg-[#EAF3DE] text-[#3B6D11]',
] as const;

const hashName = (name: string): number => {
  const s = name.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Stable color class from display name (lists stay consistent when re-sorted). */
export const getAvatarColor = (name: string): (typeof AVATAR_COLOR_CLASSES)[number] =>
  AVATAR_COLOR_CLASSES[hashName(name) % AVATAR_COLOR_CLASSES.length]!;

export const getAvatarColorByIndex = (index: number): (typeof AVATAR_COLOR_CLASSES)[number] =>
  AVATAR_COLOR_CLASSES[index % AVATAR_COLOR_CLASSES.length]!;

export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
