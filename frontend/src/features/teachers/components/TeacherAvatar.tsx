import { useEffect, useState } from 'react';
import { axiosInstance } from '../../../lib/axios';
import { teacherPhotoUrl } from '../hooks/useTeachers';

type TeacherAvatarProps = {
  teacherId: string;
  name: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-16 h-16 text-xl',
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const TeacherAvatar = ({
  teacherId,
  name,
  photoUrl,
  size = 'md',
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

  const className = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shrink-0 overflow-hidden bg-teal-50 text-teal-600`;

  if (src) {
    return <img src={src} alt="" className={`${className} object-cover`} />;
  }

  return <div className={className}>{getInitials(name)}</div>;
};
