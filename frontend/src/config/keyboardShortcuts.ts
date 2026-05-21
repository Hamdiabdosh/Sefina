import type { CurrentUser } from '../features/auth/types/auth.types';
import { getHomeRouteForUser } from '../features/auth/utils/roleRedirect';

export type ShortcutAction =
  | { type: 'navigate'; to: string }
  | { type: 'openProfile' }
  | { type: 'focusSearch' }
  | { type: 'closeOverlays' }
  | { type: 'showHelp' };

export type ShortcutDef = {
  /** i18n key under shortcuts.* */
  labelKey: string;
  /** Display keys e.g. "G then D" */
  keysDisplay: string;
  chord?: [prefix: string, key: string];
  key?: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  action: ShortcutAction;
  /** Omit = all roles with app access */
  when?: (user: CurrentUser) => boolean;
};

const superAdminChords: ShortcutDef[] = [
  { labelKey: 'goDashboard', keysDisplay: 'G then D', chord: ['g', 'd'], action: { type: 'navigate', to: '/admin/dashboard' } },
  { labelKey: 'goReports', keysDisplay: 'G then R', chord: ['g', 'r'], action: { type: 'navigate', to: '/admin/reports' } },
  { labelKey: 'goMedresas', keysDisplay: 'G then M', chord: ['g', 'm'], action: { type: 'navigate', to: '/admin/medresas' } },
  { labelKey: 'goTeachers', keysDisplay: 'G then T', chord: ['g', 't'], action: { type: 'navigate', to: '/admin/teachers' } },
  { labelKey: 'goStudents', keysDisplay: 'G then S', chord: ['g', 's'], action: { type: 'navigate', to: '/medresa/students' } },
  { labelKey: 'goAttendance', keysDisplay: 'G then A', chord: ['g', 'a'], action: { type: 'navigate', to: '/admin/attendance' } },
  { labelKey: 'goCourses', keysDisplay: 'G then C', chord: ['g', 'c'], action: { type: 'navigate', to: '/admin/courses' } },
  { labelKey: 'goFees', keysDisplay: 'G then F', chord: ['g', 'f'], action: { type: 'navigate', to: '/admin/fees' } },
  { labelKey: 'goSalaries', keysDisplay: 'G then Y', chord: ['g', 'y'], action: { type: 'navigate', to: '/admin/salaries' } },
  {
    labelKey: 'goHome',
    keysDisplay: 'G then H',
    chord: ['g', 'h'],
    action: { type: 'navigate', to: '/admin/medresas' },
  },
];

const medresaAdminChords: ShortcutDef[] = [
  { labelKey: 'goDashboard', keysDisplay: 'G then D', chord: ['g', 'd'], action: { type: 'navigate', to: '/medresa/dashboard' } },
  { labelKey: 'goCourses', keysDisplay: 'G then C', chord: ['g', 'c'], action: { type: 'navigate', to: '/medresa/courses' } },
  { labelKey: 'goStudents', keysDisplay: 'G then S', chord: ['g', 's'], action: { type: 'navigate', to: '/medresa/students' } },
  { labelKey: 'goAttendance', keysDisplay: 'G then A', chord: ['g', 'a'], action: { type: 'navigate', to: '/medresa/attendance' } },
  { labelKey: 'goFees', keysDisplay: 'G then F', chord: ['g', 'f'], action: { type: 'navigate', to: '/medresa/fees' } },
  { labelKey: 'goReports', keysDisplay: 'G then R', chord: ['g', 'r'], action: { type: 'navigate', to: '/medresa/reports' } },
  {
    labelKey: 'goHome',
    keysDisplay: 'G then H',
    chord: ['g', 'h'],
    action: { type: 'navigate', to: '/medresa/dashboard' },
  },
];

const teacherChords: ShortcutDef[] = [
  { labelKey: 'goDashboard', keysDisplay: 'G then D', chord: ['g', 'd'], action: { type: 'navigate', to: '/teacher/dashboard' } },
  { labelKey: 'goAttendance', keysDisplay: 'G then A', chord: ['g', 'a'], action: { type: 'navigate', to: '/teacher/attendance' } },
  { labelKey: 'goGrades', keysDisplay: 'G then G', chord: ['g', 'g'], action: { type: 'navigate', to: '/teacher/grades' } },
  { labelKey: 'goStudents', keysDisplay: 'G then S', chord: ['g', 's'], action: { type: 'navigate', to: '/teacher/students' } },
  { labelKey: 'goReports', keysDisplay: 'G then R', chord: ['g', 'r'], action: { type: 'navigate', to: '/teacher/reports' } },
  {
    labelKey: 'goHome',
    keysDisplay: 'G then H',
    chord: ['g', 'h'],
    action: { type: 'navigate', to: '/teacher/dashboard' },
  },
];

const globalShortcuts: ShortcutDef[] = [
  { labelKey: 'showHelp', keysDisplay: '?', key: '?', action: { type: 'showHelp' } },
  { labelKey: 'focusSearch', keysDisplay: '/', key: '/', action: { type: 'focusSearch' } },
  { labelKey: 'focusSearch', keysDisplay: 'Ctrl+K', key: 'k', ctrlOrMeta: true, action: { type: 'focusSearch' } },
  { labelKey: 'openProfile', keysDisplay: 'P', key: 'p', action: { type: 'openProfile' } },
  { labelKey: 'closePanel', keysDisplay: 'Esc', key: 'Escape', action: { type: 'closeOverlays' } },
];

export const CHORD_PREFIX = 'g';
export const CHORD_TIMEOUT_MS = 1200;

export function getShortcutsForUser(user: CurrentUser): ShortcutDef[] {
  const roleChords = user.isSuperAdmin
    ? superAdminChords
    : user.isMedresaAdmin
      ? medresaAdminChords
      : user.isTeacher
        ? teacherChords
        : [];

  const homeChord: ShortcutDef = {
    labelKey: 'goHome',
    keysDisplay: 'G then H',
    chord: ['g', 'h'],
    action: { type: 'navigate', to: getHomeRouteForUser(user) },
  };

  const chords =
    roleChords.length > 0
      ? roleChords.map((s) =>
          s.labelKey === 'goHome' ? { ...s, action: { type: 'navigate' as const, to: getHomeRouteForUser(user) } } : s
        )
      : [homeChord];

  return [...globalShortcuts, ...chords.filter((c, i, arr) => arr.findIndex((x) => x.labelKey === c.labelKey && x.keysDisplay === c.keysDisplay) === i)];
}

export function findChordMatch(
  shortcuts: ShortcutDef[],
  prefix: string,
  key: string
): ShortcutDef | undefined {
  return shortcuts.find(
    (s) => s.chord?.[0] === prefix && s.chord[1].toLowerCase() === key.toLowerCase()
  );
}

export function findSingleKeyMatch(
  shortcuts: ShortcutDef[],
  event: KeyboardEvent
): ShortcutDef | undefined {
  const key = event.key;
  return shortcuts.find((s) => {
    if (!s.key || s.chord) return false;
    if (s.ctrlOrMeta && !(event.metaKey || event.ctrlKey)) return false;
    if (!s.ctrlOrMeta && (event.metaKey || event.ctrlKey) && s.key.length === 1) return false;
    if (s.shift && !event.shiftKey) return false;
    if (!s.shift && s.key === '?' && key !== '?') return false;
    return s.key === key || (s.key === '?' && key === '?');
  });
}
