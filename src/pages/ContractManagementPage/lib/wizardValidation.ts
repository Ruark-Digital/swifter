/**
 * Pure validation / prefill rules for the Create Contract wizard. Kept out of
 * the component so they can be unit-tested without rendering the form.
 */

export type FieldIssue = { field: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const blank = (v: unknown) =>
  v === undefined || v === null || String(v).trim() === "";

// Lenient numeric parse: "1,000", "10%" and " 5 " all read as numbers.
const toNum = (v: unknown): number | undefined => {
  if (blank(v)) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const n = Number(String(v).replace(/[,%\s]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Selecting an awarded solicitation prefills the contract name only while the
 * field is empty, or still holds the name WE prefilled earlier (so switching
 * solicitations updates it). Anything the user typed is never overwritten.
 */
export const canPrefillName = (
  current: unknown,
  lastPrefilled?: string,
): boolean => {
  const value = typeof current === "string" ? current.trim() : "";
  return value === "" || (lastPrefilled !== undefined && value === lastPrefilled);
};

/** The primary contact is either a picked vendor user (id) or a valid email. */
export const isValidContactValue = (value: unknown): boolean => {
  const v = typeof value === "string" ? value.trim() : "";
  return OBJECT_ID_RE.test(v) || EMAIL_RE.test(v);
};

type ApprovalGroup = {
  name?: string | null;
  approvers?: unknown[];
  approvalLevel?: string | number | null;
  amount?: unknown;
};

/**
 * Approval groups (step 8). A completely empty row is ignored; any row with
 * something filled in needs a name, at least one approver, a level 1-5 and an
 * amount — otherwise the payload builder would silently drop it (the BE then
 * saw `approvers: []` and the Approvers tab was empty).
 */
export const validateApprovalGroups = (
  groups: ApprovalGroup[] | undefined,
): FieldIssue[] => {
  const issues: FieldIssue[] = [];
  (groups ?? []).forEach((g, i) => {
    const level = toNum(g?.approvalLevel);
    const touched =
      !blank(g?.name) ||
      (g?.approvers?.length ?? 0) > 0 ||
      !blank(g?.amount) ||
      (level !== undefined && level > 0);
    if (!touched) return;
    const at = (f: string) => `approvalGroups.${i}.${f}`;
    if (blank(g?.name))
      issues.push({ field: at("name"), message: "Group name is required" });
    if (!g?.approvers?.length)
      issues.push({
        field: at("approvers"),
        message: "Add at least one approver",
      });
    if (level === undefined || level < 1 || level > 5)
      issues.push({
        field: at("approvalLevel"),
        message: "Select an approval level (1-5)",
      });
    if (toNum(g?.amount) === undefined)
      issues.push({ field: at("amount"), message: "Amount is required" });
  });
  return issues;
};

type Values = Record<string, any>;

/** Steps 4-7 required-field rules (steps 1-3 and 8 use the yup schema). */
export const validateLaterStep = (step: number, v: Values): FieldIssue[] => {
  const issues: FieldIssue[] = [];
  if (step === 4) {
    (v.deliverables ?? []).forEach((d: Values, i: number) => {
      const hasName = !blank(d?.name);
      const hasDate = !!d?.dueDate;
      if (!hasName && !hasDate) return; // empty row is ignored
      if (!hasName)
        issues.push({
          field: `deliverables.${i}.name`,
          message: "Deliverable name is required",
        });
      if (!hasDate)
        issues.push({
          field: `deliverables.${i}.dueDate`,
          message: "Due date is required",
        });
    });
  }
  if (step === 5) {
    const value = toNum(v.contractValue);
    if (value === undefined || value <= 0)
      issues.push({
        field: "contractValue",
        message: "Contract value must be greater than 0",
      });
    if (blank(v.paymentStructure))
      issues.push({
        field: "paymentStructure",
        message: "Payment structure is required",
      });
    const holdback = toNum(v.holdback);
    if (!blank(v.holdback) && (holdback === undefined || holdback < 0 || holdback > 100))
      issues.push({
        field: "holdback",
        message: "Holdback must be a percentage between 0 and 100",
      });
  }
  if (step === 6) {
    if (v.contractSecurity === "yes" && !v.insuranceExpiryDate)
      issues.push({
        field: "insuranceExpiryDate",
        message: "Insurance expiry date is required",
      });
    if (!blank(v.securityType) && toNum(v.securityAmount) === undefined)
      issues.push({
        field: "securityAmount",
        message: "Security amount is required",
      });
  }
  return issues;
};
