import { useEffect, useState } from 'react';
import { getAvatarColor, getInitials } from '../../../lib/avatarColors';
import { cn } from '../../../lib/utils';
import { axiosInstance } from '../../../lib/axios';
import { studentPhotoUrl } from '../hooks/useStudents';

type StudentAvatarProps = {
  studentId: string;
  name: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'w-10 h-10 text-[13px]',
  md: 'w-14 h-14 text-lg',
  /** Profile / detail — scales up on desktop per UI spec (56px → 64px). */
  lg: 'w-14 h-14 text-lg md:w-16 md:h-16 md:text-xl',
};

export const StudentAvatar = ({
  studentId,
  name,
  photoUrl,
  size = 'md',
}: StudentAvatarProps) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUrl) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void axiosInstance
      .get(studentPhotoUrl(studentId), { responseType: 'blob' })
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
  }, [studentId, photoUrl]);

  const className = cn(
    sizeClasses[size],
    'rounded-full flex items-center justify-center font-medium shrink-0 overflow-hidden',
    getAvatarColor(name)
  );

  if (src) {
    return <img src={src} alt="" className={cn(className, 'object-cover')} />;
  }

  return <div className={className}>{getInitials(name)}</div>;
};
