// LEM status (ContractLemDTO) is "pending" | "approved" | "rejected" — there is
// no draft. A submitted LEM is "pending" while under approval and must not be
// editable (QA #174); only a rejected LEM can be changed, via Resubmit.
export const canResubmitLem = (status?: string | null): boolean =>
  (status ?? "").trim().toLowerCase() === "rejected";
