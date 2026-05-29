import { useEffect, useState } from 'react';
import { getAvatarColor, getInitials } from '../../../lib/avatarColors';
import { cn } from '../../../lib/utils';
import { axiosInstance } from '../../../lib/axios';
import { teacherPhotoUrl } from '../hooks/useTeachers';

type TeacherAvatarProps = {
  teacherId: string;
  name: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** Square tiles (e.g. directory cards) vs circular */
  square?: boolean;
};

const sizeClasses = {
  sm: 'w-10 h-10 text-[13px]',
  md: 'w-14 h-14 text-lg',
  lg: 'w-14 h-14 text-lg md:w-16 md:h-16 md:text-xl',
};

export const TeacherAvatar = ({
  teacherId,
  name,
  photoUrl,
  size = 'md',
  square = false,
}: TeacherAvatarProps) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUrl) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void axiosInstance
      .get(teacherPhotoUrl(teacherId), { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [teacherId, photoUrl]);

  const rounded = square ? 'rounded-[10px]' : 'rounded-full';
  const className = cn(
    sizeClasses[size],
    rounded,
    'flex items-center justify-center font-medium shrink-0 overflow-hidden',
    getAvatarColor(name)
  );

  if (src) {
    return <img src={src} alt="" className={cn(className, 'object-cover')} />;
  }

  return <div className={className}>{getInitials(name)}</div>;
};
