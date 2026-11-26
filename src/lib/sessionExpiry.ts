/**
 * Carries "your session expired" across the sign-out redirect to the login page.
 * The auth store is cleared on sign-out, so the flag lives in sessionStorage.
 */
const KEY = "swiftpro:session-expired";

export const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

export const markSessionExpired = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable: the redirect still happens, just without the note */
  }
};

export const isSessionExpiredFlagged = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const clearSessionExpired = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
