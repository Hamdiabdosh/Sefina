import { useTranslation } from 'react-i18next';
import { formatDualDateFromYmd, formatEthiopianFromYmd } from '../utils/ethiopian';

type AttendanceDateLabelProps = {
  ymd: string;
  /** Show Gregorian `YYYY-MM-DD` after Ethiopian date. */
  showGregorian?: boolean;
  className?: string;
};

export const AttendanceDateLabel = ({
  ymd,
  showGregorian = true,
  className = '',
}: AttendanceDateLabelProps) => {
  const { t } = useTranslation();
  const primary = formatEthiopianFromYmd(ymd, t);

  if (!showGregorian) {
    return <span className={className}>{primary}</span>;
  }

  return (
    <span className={className}>
      <span className="font-medium text-foreground">{primary}</span>
      <span className="text-muted-foreground"> · {ymd}</span>
    </span>
  );
};

export const AttendanceDualDateLine = ({
  ymd,
  className = '',
}: {
  ymd: string;
  className?: string;
}) => {
  const { t } = useTranslation();
  return <p className={`text-xs text-muted-foreground ${className}`.trim()}>{formatDualDateFromYmd(ymd, t)}</p>;
};
