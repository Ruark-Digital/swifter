// Helpers for the "Alerts & Recommended Actions" card (QA #141).
// The alerts endpoint's per-contract `pendingApprovals[]` / `rfiAlerts[]` are
// expanded into one detailed line each (replacing the old aggregate
// "N items pending approval" summary). Approval lines use the `pendingWith`
// ROLE — the payload ships `responsibleUsers` as raw ObjectIds, not names, so
// the exact "{Name}'s approval" wording is pending a BE change to populate
// names. Only approvals delayed 24h+ (daysWaiting >= 1) are surfaced.

export type PendingApproval = {
  entity?: string;
  id?: string;
  status?: string;
  daysWaiting?: number;
  pendingWith?: string;
  amount?: number;
};

export type RfiAlert = {
  rfiId?: string;
  title?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  daysUntilDeadline?: number | null;
  status?: string;
  daysOpen?: number;
};

const APPROVAL_ENTITY_LABELS: Record<string, string> = {
  change_directive: "Change Directive",
  change_order: "Change Order",
  change_request: "Change Request",
  change_proposal: "Change Proposal",
  invoice: "Invoice",
  rfi: "RFI",
  ncr: "NCR",
};

/** Human label for an alert entity: "change_order" -> "Change Order". Unknown
 *  values are title-cased on `_`/space so the card never shows a raw enum. */
export const formatAlertEntityLabel = (entity?: string): string => {
  if (!entity || !entity.trim()) return "Item";
  const key = entity.trim().toLowerCase();
  if (APPROVAL_ENTITY_LABELS[key]) return APPROVAL_ENTITY_LABELS[key];
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** Short number from a prefixed id: "CO-004" -> "004", "INV-001" -> "001".
 *  Falls back to the whole id when there's no `-` separator. */
export const extractAlertItemNumber = (id?: string): string => {
  if (!id || !id.trim()) return "";
  const parts = id.trim().split("-");
  return parts.length > 1 ? parts[parts.length - 1] : id.trim();
};

/** #141 — only surface approvals a user has been sitting on for 24h+. The
 *  payload's `daysWaiting` is whole days since submission, so >= 1 == 24h+. */
export const isApprovalDelayed = (item?: { daysWaiting?: number }): boolean =>
  typeof item?.daysWaiting === "number" && item.daysWaiting >= 1;

/** "Change Order 004 is pending manager approval ($5,000,000)". `formatAmount`
 *  is optional — when given and the amount is > 0 it's appended in parens. */
export const buildPendingApprovalLine = (
  item: PendingApproval,
  formatAmount?: (amount: number) => string,
): string => {
  const label = formatAlertEntityLabel(item?.entity);
  const number = extractAlertItemNumber(item?.id);
  const ref = number ? `${label} ${number}` : label;
  const role = item?.pendingWith ? String(item.pendingWith).trim().toLowerCase() : "";
  const line = role
    ? `${ref} is pending ${role} approval`
    : `${ref} is pending approval`;
  if (formatAmount && typeof item?.amount === "number" && item.amount > 0) {
    return `${line} (${formatAmount(item.amount)})`;
  }
  return line;
};

/** "RFI 001 is overdue by 3 days" when overdue, else "RFI 001 is pending response". */
export const buildRfiAlertLine = (rfi: RfiAlert): string => {
  const number = extractAlertItemNumber(rfi?.rfiId);
  const ref = number ? `RFI ${number}` : "RFI";
  if (rfi?.isOverdue && typeof rfi.daysOverdue === "number") {
    return `${ref} is overdue by ${rfi.daysOverdue} day${rfi.daysOverdue === 1 ? "" : "s"}`;
  }
  return `${ref} is pending response`;
};
