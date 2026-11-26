import { useEffect, useState } from "react";

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * True while `targetMs` is still in the future. Re-renders once at the target
 * instant so UI gated on it enables without a reload. Only schedules a timer
 * while the target is in the future, so an already-passed target never loops.
 */
export const useIsFutureTime = (targetMs: number | undefined): boolean => {
  const [tick, setTick] = useState(0);
  const valid = targetMs !== undefined && !Number.isNaN(targetMs);
  const isFuture = valid && (targetMs as number) > Date.now();

  useEffect(() => {
    if (!isFuture) return;
    const remaining = (targetMs as number) - Date.now();
    // setTimeout caps at ~24.8 days; the re-render re-schedules for farther targets.
    const timer = setTimeout(
      () => setTick((t) => t + 1),
      Math.min(remaining, MAX_TIMEOUT_MS) + 50
    );
    return () => clearTimeout(timer);
  }, [targetMs, isFuture, tick]);

  return isFuture;
};
