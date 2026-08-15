export type ChangeTabValue = "all" | "requests" | "orders" | "directive" | "proposal";

export type ContractChangeType = "request" | "directive" | "proposal" | "order";

export const changeTabToApiType = (tab: ChangeTabValue): ContractChangeType | undefined => {
  if (tab === "all") return undefined;
  if (tab === "requests") return "request";
  if (tab === "orders") return "order";
  return tab;
};

export const formatChangeTypeLabel = (type: ContractChangeType): string => {
  if (type === "request") return "Request";
  if (type === "order") return "Order";
  if (type === "directive") return "Directive";
  return "Proposal";
};

export const getCreateChangeTypeOptionsForRole = ({
  isManager,
  isVendor,
}: {
  isManager: boolean;
  isVendor: boolean;
}): Array<{ value: ContractChangeType; label: string }> => {
  if (isManager) {
    return [
      { value: "directive", label: "Change Directive" },
      { value: "order", label: "Change Order" },
    ];
  }

  if (isVendor) {
    return [
      { value: "request", label: "Change Request" },
      { value: "order", label: "Change Order" },
      { value: "proposal", label: "Change Proposal" },
    ];
  }

  return [
    { value: "request", label: "Change Request" },
    { value: "order", label: "Change Order" },
    { value: "directive", label: "Change Directive" },
    { value: "proposal", label: "Change Proposal" },
  ];
};

export const shouldShowChangeDecisionActions = (type: string | undefined) => {
  return type !== "directive";
};

export const getCreateChangeSubmitLabel = ({
  isManager,
  changeType,
}: {
  isManager: boolean;
  changeType: ContractChangeType | string | undefined;
}): string => {
  if (isManager) {
    if (changeType === "order") return "Send Change Order";
    if (changeType === "directive") return "Send Change Directive";
    return "Send Request";
  }
  if (changeType === "order") return "Submit Change Order";
  if (changeType === "request") return "Submit Change Request";
  if (changeType === "proposal") return "Submit Change Proposal";
  return "Submit Request";
};

export const getManagerApproveChangeUrl = ({
  roleBasePath,
  contractId,
  changeId,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
}) => {
  // ChangeDetailsSheet is dual-purpose (changes + claims) and is invoked
  // from both manager- and approver-prefixed basePaths. Preserve whichever
  // role prefix and entity segment came in, since `/contract/<role>/contracts/
  // {id}/{changes|claims}/{itemId}/approve` is a real endpoint on both roles
  // (see manager + approver APIs).
  const entity =
    roleBasePath.endsWith("/claims") || roleBasePath.includes("/claims/")
      ? "claims"
      : "changes";

  // Case 1: roleBasePath already ends with /{contractId}/{entity} — use as-is.
  if (roleBasePath.endsWith(`/${contractId}/${entity}`)) {
    return `${roleBasePath}/${changeId}/approve`;
  }

  // Case 2: fall back by extracting the role from roleBasePath and rebuilding
  // the full path. Defaults to "manager" when roleBasePath doesn't carry a
  // role segment (matches the prior manager-only behavior).
  const roleMatch = roleBasePath.match(
    /^\/contract\/(manager|approver|vendor|user)\/contracts/,
  );
  const role = roleMatch?.[1] ?? "manager";
  return `/contract/${role}/contracts/${contractId}/${entity}/${changeId}/approve`;
};

// ── Change edit/approve concurrency lock (#76) ───────────────────────
// The BE exposes `…/changes/{changeId}/lock` (POST acquire / DELETE release)
// so a change can't be edited or approved by two users at once. A 409 means
// another user already holds an active (30-min) lock.
export const LOCK_CONFLICT_STATUS = 409;

export type ChangeLockType = "edit" | "approve";

/**
 * Build the change lock URL. Mirrors {@link getManagerApproveChangeUrl}'s
 * dual-path handling but always targets the `changes` entity — the BE exposes
 * the lock only for changes (claims have no lock endpoint) — and preserves the
 * `contracts` vs `msa-contracts` resource segment from the incoming basePath.
 */
export const getChangeLockUrl = ({
  roleBasePath,
  contractId,
  changeId,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
}): string => {
  // Case 1: roleBasePath already ends with /{contractId}/changes — use as-is.
  if (roleBasePath.endsWith(`/${contractId}/changes`)) {
    return `${roleBasePath}/${changeId}/lock`;
  }
  // Case 2: rebuild from the role + resource segments in roleBasePath.
  const match = roleBasePath.match(
    /^\/contract\/(manager|approver|vendor|user)\/(contracts|msa-contracts)/,
  );
  const role = match?.[1] ?? "manager";
  const resource = match?.[2] ?? "contracts";
  return `/contract/${role}/${resource}/${contractId}/changes/${changeId}/lock`;
};

/** True when an error is the lock's 409 Conflict (another user holds it). */
export const isLockConflict = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status ===
  LOCK_CONFLICT_STATUS;

/**
 * Best-effort extraction of the current lock holder's name from a 409 body,
 * tolerating the several shapes the BE might use. Returns undefined when the
 * body carries no name — callers fall back to a generic "another user".
 */
export const extractLockHolderName = (error: unknown): string | undefined => {
  const data = (error as { response?: { data?: any } })?.response?.data;
  const holder =
    data?.data?.lockedBy ??
    data?.lockedBy ??
    data?.data?.holder ??
    data?.holder;
  if (!holder) return undefined;
  return typeof holder === "string" ? holder : holder?.name ?? holder?.email;
};

// ── Draft change-order finalization (#79) ────────────────────────────
// When a change request/proposal is approved (or a directive is actioned),
// the BE auto-creates a **draft** change order (`type: "order"`, `status:
// "draft"` — the "draft" status is real but was missing from the swagger
// enum). The original requester (Vendor PM for CR/CP, CM for a directive)
// then either directly finalizes it via `approve-draft-co` (applies the value
// to the contract immediately) or edits it (PUT) to route it through a fresh
// approval.
export const isDraftChangeOrder = (
  change: { type?: string | null; status?: string | null } | null | undefined,
): boolean =>
  !!change &&
  (change.type ?? "").toLowerCase() === "order" &&
  (change.status ?? "").toLowerCase() === "draft";

// A draft change order is finalized/edited by its ORIGINATOR: the Vendor PM for
// a change-request/proposal-origin draft, the CM for a directive-origin draft.
// The CM must NOT get a convert/approve action on a CR/CP-origin draft by
// default — only after the Vendor PM edits it and sends it for a fresh approval
// (QA #117). A missing/unknown origin falls back to the CM (directive/legacy).
export const isCrCpOriginDraftCo = (
  change: { originalChangeType?: string | null } | null | undefined,
): boolean => {
  const origin = (change?.originalChangeType ?? "").toLowerCase();
  return origin === "request" || origin === "proposal";
};

/**
 * Build the `approve-draft-co` URL. Mirrors {@link getChangeLockUrl}'s
 * dual-path handling — preserves the incoming role prefix and the
 * `contracts` vs `msa-contracts` resource segment. Only the `manager` and
 * `vendor` roles have this endpoint; the caller gates on role.
 */
export const getApproveDraftCoUrl = ({
  roleBasePath,
  contractId,
  changeId,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
}): string => {
  if (roleBasePath.endsWith(`/${contractId}/changes`)) {
    return `${roleBasePath}/${changeId}/approve-draft-co`;
  }
  const match = roleBasePath.match(
    /^\/contract\/(manager|approver|vendor|user)\/(contracts|msa-contracts)/,
  );
  const role = match?.[1] ?? "manager";
  const resource = match?.[2] ?? "contracts";
  return `/contract/${role}/${resource}/${contractId}/changes/${changeId}/approve-draft-co`;
};

export type ManagerCreateChangeDialogValues = {
  changeName: string;
  changeType: string;
  urgency: string;
  description: string;
  amount?: string;
};

const parseAmountToNumber = (raw?: string): number | undefined => {
  if (raw == null) return undefined;
  const cleaned = String(raw).replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

export type UploadURLs = {
  size: string;
  type: string;
  url: string;
  name: string;
  download: string;
};

export const toContractChangeFileItem = (
  file: File,
  uploaded: Pick<UploadURLs, "name" | "url" | "type" | "size">
): { name: string; url: string; type: string; size: string } => {
  return {
    name: uploaded.name || file.name,
    url: uploaded.url,
    type: uploaded.type || file.type,
    size: uploaded.size ?? "",
  };
};

type ChangeFileItem = { name: string; url: string; type: string; size: string | number };

/**
 * Merge previously-attached documents with newly uploaded ones for a
 * change-order/request/proposal resubmit. Existing files are preserved and new
 * uploads appended (de-duped by URL, then name) — a resubmit that sent only the
 * new uploads dropped the prior attachments (QA #116).
 */
export const mergeChangeAttachments = (
  existingFiles: ChangeFileItem[] = [],
  uploadedFiles: ChangeFileItem[] = []
): ChangeFileItem[] => {
  const seen = new Set<string>();
  return [...existingFiles, ...uploadedFiles].filter((f) => {
    const key = f?.url || f?.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const toManagerCreateChangePayload = (
  values: ManagerCreateChangeDialogValues
): {
  title?: string;
  description?: string;
  type?: "directive" | "order";
  urgency?: "low" | "medium" | "high";
  amount?: number;
  files?: Array<{ name: string; url: string; type: string; size: string }>;
} => {
  const payload: {
    title?: string;
    description?: string;
    type?: "directive" | "order";
    urgency?: "low" | "medium" | "high";
    amount?: number;
    files?: Array<{ name: string; url: string; type: string; size: string }>;
  } = {
    title: values.changeName,
    description: values.description,
  };

  if (
    values.changeType === "directive" ||
    values.changeType === "order"
  ) {
    payload.type = values.changeType as "directive" | "order";
  }

  if (values.urgency === "low" || values.urgency === "medium" || values.urgency === "high") {
    payload.urgency = values.urgency;
  }

  const amount = parseAmountToNumber(values.amount);
  if (amount !== undefined) {
    payload.amount = amount;
  }

  return payload;
};

export const toVendorCreateChangePayload = (
  values: ManagerCreateChangeDialogValues
): {
  title: string;
  description: string;
  type: "request" | "order" | "proposal";
  proposalCategory?: string;
  urgency?: "low" | "medium" | "high";
  amount?: number;
  files?: Array<{ name: string; url: string; type: string; size: string }>;
} => {
  const type =
    values.changeType === "request" ||
    values.changeType === "order" ||
    values.changeType === "proposal"
      ? (values.changeType as "request" | "order" | "proposal")
      : "request";

  const payload: {
    title: string;
    description: string;
    type: "request" | "order" | "proposal";
    proposalCategory?: string;
    urgency?: "low" | "medium" | "high";
    amount?: number;
    files?: Array<{ name: string; url: string; type: string; size: string }>;
  } = {
    title: values.changeName,
    description: values.description,
    type,
  };

  if (type === "proposal") {
    payload.proposalCategory = "placeholder";
  }

  if (values.urgency === "low" || values.urgency === "medium" || values.urgency === "high") {
    payload.urgency = values.urgency;
  }

  const amount = parseAmountToNumber(values.amount);
  if (amount !== undefined) {
    payload.amount = amount;
  }

  return payload;
};

// ── Convert change directive (#147) ──────────────────────────────────
// A change directive (CD) is issued by a CM/Approver and needs no approval of
// itself. The assigned Vendor PM responds by **converting** it into a Change
// Order (CO) or Change Proposal (CP) via `convert-directive`; the new change
// then runs the standard approval flow (CM first, then approvers). The BE
// requires `title`, `description`, `amount` and `type` — the convert dialog
// pre-fills the first three from the directive. `proposalCategory`, `urgency`,
// `approvers` and `files` are optional (mirrors ContractChangeConvertDirectiveDTO).
export const getConvertDirectiveUrl = ({
  roleBasePath,
  contractId,
  changeId,
}: {
  roleBasePath: string;
  contractId: string;
  changeId: string;
}): string => {
  if (roleBasePath.endsWith(`/${contractId}/changes`)) {
    return `${roleBasePath}/${changeId}/convert-directive`;
  }
  // convert-directive is a vendor-only endpoint, so fall back to `vendor`
  // (unlike the lock/approve builders which default to manager).
  const match = roleBasePath.match(
    /^\/contract\/(manager|approver|vendor|user)\/(contracts|msa-contracts)/,
  );
  const role = match?.[1] ?? "vendor";
  const resource = match?.[2] ?? "contracts";
  return `/contract/${role}/${resource}/${contractId}/changes/${changeId}/convert-directive`;
};

export type ConvertDirectiveDialogValues = {
  type: "order" | "proposal";
  title: string;
  description: string;
  amount?: string;
  urgency?: string;
  proposalCategory?: string;
};

export type ContractChangeConvertDirectivePayload = {
  title: string;
  description: string;
  amount: number;
  type: "order" | "proposal";
  proposalCategory?: string;
  urgency?: "low" | "medium" | "high";
};

export const toConvertDirectivePayload = (
  values: ConvertDirectiveDialogValues,
): ContractChangeConvertDirectivePayload => {
  const payload: ContractChangeConvertDirectivePayload = {
    title: values.title,
    description: values.description,
    amount: parseAmountToNumber(values.amount) ?? 0,
    type: values.type,
  };

  // Proposals carry a category. Mirror the create-change flow, which always
  // sends `proposalCategory: "placeholder"` for proposals (BE marks it optional
  // but the create path relies on it) — prefer an explicit value when given.
  if (values.type === "proposal") {
    payload.proposalCategory = values.proposalCategory || "placeholder";
  }

  if (
    values.urgency === "low" ||
    values.urgency === "medium" ||
    values.urgency === "high"
  ) {
    payload.urgency = values.urgency;
  }

  return payload;
};

export { pruneEmptyValuesDeep } from "@/lib/pruneEmptyValuesDeep";
