import { BookOpen, MapPin, Phone, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrnateCard } from '../../../components/islamic';
import type { PublicMedresa } from '../types';

type MedresaShowcaseCardProps = {
  medresa: PublicMedresa;
};

export const MedresaShowcaseCard = ({ medresa }: MedresaShowcaseCardProps) => {
  const { t } = useTranslation();
  const { students, teacher_medresas, medresa_courses } = medresa._count;

  return (
    <OrnateCard title={medresa.name} icon={<MapPin size={20} className="text-teal-600" />}>
      <p className="text-sm leading-relaxed text-muted-foreground">{medresa.location}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-cream px-2 py-2">
          <dt className="sr-only">{t('marketing.stats.students')}</dt>
          <dd className="text-base font-semibold tabular-nums text-teal-800">{students}</dd>
          <dd className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Users size={11} aria-hidden />
            {t('marketing.stats.students')}
          </dd>
        </div>
        <div className="rounded-lg bg-cream px-2 py-2">
          <dt className="sr-only">{t('marketing.stats.teachers')}</dt>
          <dd className="text-base font-semibold tabular-nums text-teal-800">{teacher_medresas}</dd>
          <dd className="mt-0.5 text-[10px] text-muted-foreground">{t('marketing.stats.teachers')}</dd>
        </div>
        <div className="rounded-lg bg-cream px-2 py-2">
          <dt className="sr-only">{t('marketing.stats.courses')}</dt>
          <dd className="text-base font-semibold tabular-nums text-teal-800">{medresa_courses}</dd>
          <dd className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <BookOpen size={11} aria-hidden />
            {t('marketing.stats.courses')}
          </dd>
        </div>
      </dl>

      {medresa.phone ? (
        <a
          href={`tel:${medresa.phone.replace(/\s/g, '')}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800"
        >
          <Phone size={14} aria-hidden />
          {medresa.phone}
        </a>
      ) : null}
    </OrnateCard>
  );
};
