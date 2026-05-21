/** Dispatched to focus the primary list search field on the current page. */
export const FOCUS_SEARCH_EVENT = 'sefina:focus-search';

export const dispatchFocusSearch = (): void => {
  document.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT));
};

export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
};
