import { useEffect, type RefObject } from 'react';
import { FOCUS_SEARCH_EVENT } from '../lib/keyboard';

/** Focuses the page search input when the user presses / or Ctrl+K. */
export const useFocusSearchShortcut = (
  inputRef: RefObject<HTMLInputElement | null>
): void => {
  useEffect(() => {
    const onFocusSearch = () => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    };
    document.addEventListener(FOCUS_SEARCH_EVENT, onFocusSearch);
    return () => document.removeEventListener(FOCUS_SEARCH_EVENT, onFocusSearch);
  }, [inputRef]);
};
