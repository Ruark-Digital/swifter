import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "ct:lazyReloadOnce";

// Wrap React.lazy so that a stale dynamic-import (chunk hash gone after deploy)
// triggers a single hard reload instead of leaving the user on a broken screen.
// Sentry: TypeError: Failed to fetch dynamically imported module
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      window.sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isChunkError =
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg);
      if (isChunkError && window.sessionStorage.getItem(RELOAD_KEY) !== "1") {
        window.sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        return new Promise(() => {}) as never;
      }
      throw err;
    }
  });
}
