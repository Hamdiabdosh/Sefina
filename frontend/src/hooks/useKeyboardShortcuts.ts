import { useEffect, useRef } from 'react';
import {
  CHORD_PREFIX,
  CHORD_TIMEOUT_MS,
  findChordMatch,
  findSingleKeyMatch,
  getShortcutsForUser,
  type ShortcutAction,
} from '../config/keyboardShortcuts';
import type { CurrentUser } from '../features/auth/types/auth.types';
import { dispatchFocusSearch, isEditableTarget } from '../lib/keyboard';

export type KeyboardShortcutsHandlers = {
  onNavigate: (to: string) => void;
  onOpenProfile: () => void;
  onShowHelp: () => void;
  onCloseOverlays: () => void;
};

const runAction = (action: ShortcutAction, handlers: KeyboardShortcutsHandlers): void => {
  switch (action.type) {
    case 'navigate':
      handlers.onNavigate(action.to);
      break;
    case 'openProfile':
      handlers.onOpenProfile();
      break;
    case 'focusSearch':
      dispatchFocusSearch();
      break;
    case 'showHelp':
      handlers.onShowHelp();
      break;
    case 'closeOverlays':
      handlers.onCloseOverlays();
      break;
  }
};

export const useKeyboardShortcuts = (
  user: CurrentUser | null,
  handlers: KeyboardShortcutsHandlers,
  enabled = true
): void => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const chordPendingRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    const shortcuts = getShortcutsForUser(user);

    const clearChord = () => {
      chordPendingRef.current = false;
      if (chordTimerRef.current) {
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const h = handlersRef.current;

      if (key === 'Escape') {
        const match = findSingleKeyMatch(shortcuts, event);
        if (match) {
          event.preventDefault();
          runAction(match.action, h);
        }
        clearChord();
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (chordPendingRef.current && key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        const match = findChordMatch(shortcuts, CHORD_PREFIX, key);
        clearChord();
        if (match) runAction(match.action, h);
        return;
      }

      if (
        key.toLowerCase() === CHORD_PREFIX &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        chordPendingRef.current = true;
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
        chordTimerRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS);
        return;
      }

      const match = findSingleKeyMatch(shortcuts, event);
      if (match) {
        event.preventDefault();
        runAction(match.action, h);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearChord();
    };
  }, [enabled, user]);
};
