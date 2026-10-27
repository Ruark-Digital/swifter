import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Returns a back handler that navigates to the previous in-app page, or to
 * `fallback` when the current page was opened directly (deep link, page
 * refresh, or a new tab) and there is no in-app history to go back to.
 *
 * React Router v6 assigns the very first history entry a `key` of `"default"`.
 * In that case `navigate(-1)` would either no-op or leave the app entirely, so
 * we route to a sensible fallback instead.
 */
export function useGoBack(fallback: string = "/dashboard") {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key === "default") {
      navigate(fallback, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, location.key, fallback]);
}
