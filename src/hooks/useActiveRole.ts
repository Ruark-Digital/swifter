import { useCallback, useEffect, useState } from "react";
import { UserRole } from "@/types";

// Precedence for picking a sensible default active role when the user hasn't
// chosen one. Only used to seed the default; the user can switch freely.
const PRECEDENCE: UserRole[] = [
  "company_admin",
  "super_admin",
  "contract_manager",
  "procurement",
  "approver",
  "evaluator",
  "project_manager",
  "vendor",
  "view_only",
];

const pickDefault = (set: UserRole[]): UserRole => {
  const winner = PRECEDENCE.find((role) => set.includes(role));
  return winner ?? set[0] ?? "view_only";
};

const storageKey = (userId?: string) => `activeRole:${userId ?? "anon"}`;

/**
 * Resolves and persists a single *active* role from the user's role set.
 * - Honors a previously chosen role (localStorage, keyed by user id) if it's
 *   still in the set; otherwise falls back to the precedence default.
 * - Resets automatically when the set changes and the persisted choice is no
 *   longer valid.
 * `roleSet` is treated by content (joined signature) so a fresh array identity
 * each render does not churn the effect.
 */
export const useActiveRole = (roleSet: UserRole[], userId?: string) => {
  const roleKey = roleSet.join(",");

  const resolve = useCallback((): UserRole => {
    const set = (roleKey ? roleKey.split(",") : []) as UserRole[];
    try {
      const stored = window.localStorage.getItem(
        storageKey(userId)
      ) as UserRole | null;
      if (stored && set.includes(stored)) return stored;
    } catch {
      /* localStorage unavailable — fall through to default */
    }
    return pickDefault(set);
  }, [roleKey, userId]);

  const [activeRole, setActiveRoleState] = useState<UserRole>(resolve);

  useEffect(() => {
    setActiveRoleState(resolve());
  }, [resolve]);

  const setActiveRole = useCallback(
    (role: UserRole) => {
      const set = (roleKey ? roleKey.split(",") : []) as UserRole[];
      if (!set.includes(role)) return;
      try {
        window.localStorage.setItem(storageKey(userId), role);
      } catch {
        /* ignore persistence failure */
      }
      setActiveRoleState(role);
    },
    [roleKey, userId]
  );

  return { activeRole, setActiveRole };
};
