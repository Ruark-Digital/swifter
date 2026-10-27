import { useCallback, useEffect, useRef } from "react";
import { deleteRequest, postRequest } from "@/lib/axiosInstance";
import {
  extractLockHolderName,
  getChangeLockUrl,
  isLockConflict,
  type ChangeLockType,
} from "../lib/contractChanges";

export type AcquireLockResult =
  | { ok: true }
  | { ok: false; conflict: true; holder?: string };

/**
 * Concurrency lock for editing/approving a contract change (#76).
 *
 * `acquire(lockType)` POSTs the lock and returns `{ ok: true }` on success.
 * A **409** (another user holds it) returns `{ ok: false, conflict: true }`
 * with the holder's name when the BE provides one — the caller blocks and
 * surfaces it. Any **other** failure is treated as `{ ok: true }` (fail-open):
 * a flaky lock service must never stop a user from editing/approving.
 *
 * `release()` best-effort DELETEs the lock; it also runs automatically on
 * unmount so a closed sheet never leaves the change locked for 30 minutes.
 */
export function useChangeLock({
  roleBasePath,
  contractId,
  changeId,
  enabled = true,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
  enabled?: boolean;
}) {
  const heldRef = useRef(false);

  const url = getChangeLockUrl({ roleBasePath, contractId, changeId });
  // Keep the latest url in a ref so the unmount cleanup releases the right
  // lock without re-subscribing the effect on every render.
  const urlRef = useRef(url);
  urlRef.current = url;

  const acquire = useCallback(
    async (lockType: ChangeLockType): Promise<AcquireLockResult> => {
      if (!enabled) return { ok: true };
      try {
        await postRequest({ url: urlRef.current, payload: { lockType } });
        heldRef.current = true;
        return { ok: true };
      } catch (err) {
        if (isLockConflict(err)) {
          return { ok: false, conflict: true, holder: extractLockHolderName(err) };
        }
        // Fail-open: never block the action on a non-conflict lock error.
        return { ok: true };
      }
    },
    [enabled],
  );

  const release = useCallback(async () => {
    if (!heldRef.current) return;
    heldRef.current = false;
    try {
      await deleteRequest({ url: urlRef.current });
    } catch {
      // Best-effort — the BE lock also expires on its own (30 min).
    }
  }, []);

  useEffect(() => {
    return () => {
      if (heldRef.current) {
        heldRef.current = false;
        deleteRequest({ url: urlRef.current }).catch(() => {});
      }
    };
  }, []);

  return { acquire, release };
}
