// MSA detail tab keys and the per-role tab whitelist. Extracted from
// MsaDetailPage so the role gating can be unit-tested without importing the
// page component (which transitively pulls react-pdf/pdfjs — unavailable under
// jsdom).

export type MsaTabKey =
  | "overview"
  | "analytics"
  | "kpi"
  | "compliance"
  | "documents"
  | "amendments"
  | "deliverables"
  | "payment-summary"
  | "rate-sheets"
  | "lem"
  | "invoice"
  | "change"
  | "claims"
  | "rfi"
  | "ncr-log"
  | "approvers"
  | "vendor-personnel"
  | "reports"
  | "action-log"
  | "clause-library";

export const ROLE_TAB_WHITELIST: Record<
  "approver" | "vendor" | "manager" | "view only",
  MsaTabKey[]
> = {
  approver: [
    "overview",
    "analytics",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    // "approvers" intentionally omitted — approvers can't see the Approvers tab
    "reports",
    "payment-summary",
    // Approvers get a read/approve view of rate sheets (QA #35). BE exposes
    // /approver/msa-contracts/{id}/ratesheets and RateSheetsTabContent
    // resolves the approver base path for the msa-contracts segment.
    "rate-sheets",
    // Approvers can view the Clause Library (parity with the manager view).
    "clause-library",
  ],
  vendor: [
    "overview",
    "compliance",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    // "approvers" intentionally omitted — vendors and project managers can't see the Approvers tab
    "reports",
    "payment-summary",
    "rate-sheets",
  ],
  manager: [
    "overview",
    "analytics",
    "kpi",
    "compliance",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    "approvers",
    "vendor-personnel",
    "reports",
    "payment-summary",
    "action-log",
    "rate-sheets",
    "clause-library",
  ],
  "view only": [
    "overview",
    "documents",
    "amendments",
    "lem",
    "invoice",
    "change",
    "claims",
    "rfi",
    "deliverables",
    "ncr-log",
    // "approvers" intentionally omitted — there is no view-only approvers
    // endpoint, so showing the tab red-flagged on open (QA #108).
    "reports",
    // QA #106: read-only tabs the BE exposes under /user/msa-contracts/{id}/…
    // (ratesheets, vendor-personnel, logs, clauses).
    "rate-sheets",
    "vendor-personnel",
    "action-log",
    "clause-library",
    // QA #106 (rest): now BE-unblocked in docs.json v2.3.0 —
    // /user/msa-contracts/{id}/{kpis,compliance,payment-savings,dashboard/*}.
    // Each tab-content resolves the /user base path and gates its write actions
    // behind manager/vendor roles, so view-only gets a read-only view.
    "analytics",
    "kpi",
    "compliance",
    "payment-summary",
  ],
};
