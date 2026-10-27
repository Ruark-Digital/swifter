import { useCallback, useEffect } from "react";
import { create } from "zustand";
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

// Shared across every `useUserRole`/`useActiveRole` call site (header switcher,
// dashboard, sidebar gating, etc). Plain component-local `useState` here would
// give each call site its own copy, so switching roles in one place (e.g. the
// header RoleSwitcher) would silently fail to update everywhere else — the
// dashboard view stays on the old role's layout because its own local state
// never re-resolves.
type ActiveRoleStore = {
  activeRole: UserRole | null;
  userId: string | null;
  syncForUser: (role: UserRole, userId?: string) => void;
  setActiveRole: (role: UserRole, userId?: string) => void;
};

const useActiveRoleStore = create<ActiveRoleStore>((set) => ({
  activeRole: null,
  userId: null,
  syncForUser: (role, userId) => set({ activeRole: role, userId: userId ?? null }),
  setActiveRole: (role, userId) => {
    try {
      window.localStorage.setItem(storageKey(userId), role);
    } catch {
      /* ignore persistence failure */
    }
    set({ activeRole: role, userId: userId ?? null });
  },
}));

// Test-only escape hatch: the store above is a module singleton (that's the
// point — it's what makes the header switcher and the dashboard agree), but
// that means it persists across test cases in the same file unless reset.
export const __resetActiveRoleStoreForTests = () =>
  useActiveRoleStore.setState({ activeRole: null, userId: null });

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
  const storeRole = useActiveRoleStore((s) => s.activeRole);
  const storeUserId = useActiveRoleStore((s) => s.userId);
  const syncForUser = useActiveRoleStore((s) => s.syncForUser);
  const storeSetActiveRole = useActiveRoleStore((s) => s.setActiveRole);

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

  const isStoreValidForThisSet =
    storeUserId === (userId ?? null) &&
    !!storeRole &&
    (roleKey ? roleKey.split(",") : []).includes(storeRole);

  useEffect(() => {
    if (isStoreValidForThisSet) return;
    syncForUser(resolve(), userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStoreValidForThisSet, resolve, userId]);

  const activeRole = isStoreValidForThisSet ? (storeRole as UserRole) : resolve();

  const setActiveRole = useCallback(
    (role: UserRole) => {
      const set = (roleKey ? roleKey.split(",") : []) as UserRole[];
      if (!set.includes(role)) return;
      storeSetActiveRole(role, userId);
    },
    [roleKey, userId, storeSetActiveRole]
  );

  return { activeRole, setActiveRole };
};
