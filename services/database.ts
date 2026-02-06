
// Deprecated: LocalStorage-based mock DB removed.
// Keeping a stub to avoid accidental usage in production.
export const db = {
  init: () => {},
  getSession: () => null,
  setSession: () => {},
  clearSession: () => {},
};
