// Shared, component-free helpers for contract/MSA lifecycle actions so the
// dialog component file can keep a single component export (fast-refresh safe).

export type LifecycleAction =
  | "terminate"
  | "suspend"
  | "unsuspend"
  | "complete"
  | "manage";

const normStatus = (s?: string) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, "_");

const normalizeLifecycleStatus = (status?: string) => {
  const normalized = normStatus(status);
  return normalized === "published" ? "publish" : normalized;
};

/** Edit is only offered while the contract/MSA is still a draft. */
export const isEditableStatus = (status?: string): boolean =>
  normalizeLifecycleStatus(status) === "draft";

/**
 * Status → available lifecycle actions (excludes `manage`, which is owner-based
 * not status-based). Per product rule 2026-06-01: pending approval allows
 * terminate + suspend; active/publish also allows complete; ended states none.
 * A suspended contract can be reactivated (un-suspend) — QA #237.
 */
export const availableLifecycleActions = (
  status?: string,
): LifecycleAction[] => {
  const s = normalizeLifecycleStatus(status);
  const actions: LifecycleAction[] = [];
  if (s === "pending_approval" || s === "active" || s === "publish") {
    actions.push("terminate", "suspend");
  }
  if (s === "active" || s === "publish") {
    actions.push("complete");
  }
  if (s === "suspended") {
    actions.push("unsuspend");
  }
  return actions;
};
