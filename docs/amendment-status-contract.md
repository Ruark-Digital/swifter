# Contract Amendment — Status Contract (FE ↔ BE)

How the frontend interprets amendment status fields and decides **whose turn it
is** (vendor / contract manager / approver). Written for the backend team so the
payload fields stay consistent with what the UI relies on.

Scope: contract amendments (`/contract/.../amendments`) and MSA amendments
(same component/logic). Primary source: `AmendmentsTable.tsx`.

---

## 1. Fields the frontend reads

| Field | Shape | Meaning (FE interpretation) | FE uses it for |
|---|---|---|---|
| **`vendorStatus`** (flat) | `"pending" \| "accepted" \| "rejected"` | **Current vendor gate — whose turn it is.** Must flip to `"pending"` whenever the amendment is *returned to the vendor*. | `vendorCanReview`, `vendorAccepted`, `vendorRejected` (all action gating) |
| **`vendorAction`** | `{ status, actionedAt }` | The vendor's **last recorded decision** (+ timestamp). | The "Vendor: Accepted/Rejected" **display label only** |
| **`approverStatus`** (flat) | `"pending" \| "approved" \| "rejected" \| "N/A"` | Current approver decision state. | Approver Approve/Reject footer |
| **`managerAction`** | `{ status, actionedAt, user }` | Manager/approver-side decision. | metadata / display |
| **`assignApprover`** | `boolean` | `true` once approvers have been assigned (routing done). | Hides "Assign Approval" |
| **`approvers[]`** | array | Assigned approver pool. | Hides "Assign Approval" when non-empty |
| **`impact`** | `"time" \| "cost" \| "time_cost" \| "others"` | `time` / `others` require manager approval-routing. | `requiresManagerApprovalRouting` |
| **`status`** (top-level) | `"pending" \| "approved" \| "rejected"` | Overall lifecycle. **Only `"approved"` is treated as terminal.** | `isStatusFinalized = status === "approved"` |

---

## 2. State → who acts (gate matrix)

| Scenario | `vendorStatus` (gate) | `vendorAction.status` (label) | `approverStatus` | `assignApprover` / `approvers` | top `status` | UI action shown |
|---|---|---|---|---|---|---|
| New amendment | `pending` | `pending` / – | `N/A` / `pending` | `false` / empty | `pending` | **Vendor:** Accept / Reject |
| Vendor rejected | `rejected` | `rejected` | – | `false` | `rejected` | **CM:** Modify & Resubmit |
| CM modified → returned | `pending` | `rejected` | `pending` | `false` | `rejected` (stale) | **Vendor:** Accept / Reject + "returned" banner |
| Vendor accepted, routing needed (`time`/`others`) | `accepted` | `accepted` | `pending` | `false` / empty | `pending` | **CM:** Assign Approval |
| Approvers assigned | `accepted` | `accepted` | `pending` | `true` / non-empty | `pending` | **Approver:** Approve / Reject |
| **Approver rejected → returned to vendor** | **`pending`** | `accepted` | (rejected / reset) | `true` | `rejected` | **Vendor:** Accept / Reject + "returned" banner |
| Approved (final) | `accepted` | `accepted` | `approved` | `true` | `approved` | none (finalized) |

Notes:
- `cost` and `time_cost` impacts do **not** require manager approval-routing, so
  "Assign Approval" never appears for them.
- The vendor footer is gated to the project-manager (vendor-side) role; the CM
  footers to the contract manager/procurement **owner**; the approver footer to
  the approver role.

---

## 3. Exact FE gating logic (for reference)

```
vendorGate        = vendorStatus ?? vendorAction.status      // current gate
vendorLastAction  = vendorAction.status ?? vendorStatus      // display label

vendorCanReview   = vendorGate === "pending"
vendorAccepted    = vendorGate === "accepted" | "approved"
vendorRejected    = vendorGate === "rejected"
isStatusFinalized = status === "approved"                    // rejected is NOT terminal

Vendor Accept/Reject   : isProjectManager && vendorCanReview
CM Modify & Resubmit   : isManager && owner && vendorRejected
CM Assign Approval      : isManager && owner && !isStatusFinalized
                          && !assignApprover && !approvers.length
                          && requiresManagerApprovalRouting && vendorAccepted
Approver Approve/Reject : isApprover && approverStatus === "pending" && vendorAccepted
```

---

## 4. What the FE needs the BE to guarantee

1. **`vendorStatus` is the current gate.** Set it to `"pending"` on *every*
   return-to-vendor — a CM modification after a vendor rejection, **and** an
   approver rejection. The FE shows the vendor's Accept/Reject off this field,
   not off `vendorAction.status` (which keeps the last decision).
2. **Approver rejection returns to the vendor, not the CM.** So
   `vendorStatus → "pending"` after an approver rejects; the CM does **not** get
   "Modify & Resubmit" in that state.
3. **`status` is only terminal when `"approved"`.** It is currently left **stale
   at `"rejected"`** after a vendor re-accepts (observed:
   `vendorAction=accepted`, `vendorStatus=pending`, `status=rejected`). Please
   move `status` off `"rejected"` once the amendment is re-opened/accepted; the
   FE no longer trusts top-level `status` for gating because of this.

---

## 5. Open questions for the BE (please confirm)

- In the "approver rejected → returned" payload, the approver's rejection
  appeared on **`managerAction.status: "rejected"`**, and **`approverStatus` was
  not clearly present**, while `vendorStatus` was `"pending"`. Which field
  carries the approver's decision after a return, and what is `approverStatus`
  set to in that state?
- `vendorAction.status`, flat `vendorStatus`, and top-level `status` disagreed in
  two captured payloads. The contract above assumes **flat `vendorStatus` is
  authoritative for "whose turn"** — please confirm that is the intent.

---

## Appendix — captured payloads

**A. Vendor accepted, awaiting approver assignment (routing)**
```json
{
  "vendorAction":  { "status": "accepted" },
  "vendorStatus":  "accepted",
  "approverStatus":"pending",
  "managerAction": { "status": "pending" },
  "impact":        "time",
  "assignApprover": false,
  "status":        "rejected"
}
```

**B. Approver rejected → returned to vendor**
```json
{
  "vendorAction":  { "status": "accepted", "actionedAt": "2026-10-03T13:55:33Z" },
  "vendorStatus":  "pending",
  "managerAction": { "status": "rejected", "actionedAt": "2026-10-03T14:17:52Z" },
  "impact":        "time",
  "status":        "rejected"
}
```
