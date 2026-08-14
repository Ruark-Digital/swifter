import { test, expect } from "@playwright/test";
import {
  buildPendingApprovalLine,
  buildRfiAlertLine,
  extractAlertItemNumber,
  formatAlertEntityLabel,
  isApprovalDelayed,
} from "../lib/contractAlerts";

test.describe("contractAlerts helpers (unit) — QA #141", () => {
  test("maps alert entity keys to human labels", async () => {
    expect(formatAlertEntityLabel("change_directive")).toBe("Change Directive");
    expect(formatAlertEntityLabel("change_order")).toBe("Change Order");
    expect(formatAlertEntityLabel("change_request")).toBe("Change Request");
    expect(formatAlertEntityLabel("change_proposal")).toBe("Change Proposal");
    expect(formatAlertEntityLabel("invoice")).toBe("Invoice");
    // Unknown → title-cased on underscores; empty/undefined → "Item".
    expect(formatAlertEntityLabel("some_new_thing")).toBe("Some New Thing");
    expect(formatAlertEntityLabel("")).toBe("Item");
    expect(formatAlertEntityLabel(undefined)).toBe("Item");
  });

  test("extracts the short item number from a prefixed id", async () => {
    expect(extractAlertItemNumber("CO-004")).toBe("004");
    expect(extractAlertItemNumber("INV-001")).toBe("001");
    expect(extractAlertItemNumber("RFI-001")).toBe("001");
    // No separator → whole id; empty/undefined → "".
    expect(extractAlertItemNumber("CO004")).toBe("CO004");
    expect(extractAlertItemNumber("")).toBe("");
    expect(extractAlertItemNumber(undefined)).toBe("");
  });

  test("gates approvals to 24h+ delay (daysWaiting >= 1)", async () => {
    expect(isApprovalDelayed({ daysWaiting: 1 })).toBe(true);
    expect(isApprovalDelayed({ daysWaiting: 7 })).toBe(true);
    expect(isApprovalDelayed({ daysWaiting: 0 })).toBe(false);
    expect(isApprovalDelayed({})).toBe(false);
    expect(isApprovalDelayed(undefined)).toBe(false);
  });

  test("builds a detailed pending-approval line with role + amount", async () => {
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

    expect(
      buildPendingApprovalLine(
        { entity: "change_order", id: "CO-004", pendingWith: "manager", amount: 5000000 },
        fmt,
      )
    ).toBe("Change Order 004 is pending manager approval ($5,000,000)");

    // Approver role, no amount formatter → no trailing parens.
    expect(
      buildPendingApprovalLine({
        entity: "change_directive",
        id: "CD-001",
        pendingWith: "approver",
      })
    ).toBe("Change Directive 001 is pending approver approval");

    // Missing pendingWith → generic "is pending approval". Zero amount omitted.
    expect(
      buildPendingApprovalLine({ entity: "invoice", id: "INV-002", amount: 0 }, fmt)
    ).toBe("Invoice 002 is pending approval");
  });

  test("builds RFI lines — overdue vs pending response", async () => {
    expect(
      buildRfiAlertLine({ rfiId: "RFI-001", isOverdue: true, daysOverdue: 3 })
    ).toBe("RFI 001 is overdue by 3 days");
    // Singular day.
    expect(
      buildRfiAlertLine({ rfiId: "RFI-002", isOverdue: true, daysOverdue: 1 })
    ).toBe("RFI 002 is overdue by 1 day");
    // Not overdue → pending response.
    expect(
      buildRfiAlertLine({ rfiId: "RFI-003", isOverdue: false, daysUntilDeadline: 2 })
    ).toBe("RFI 003 is pending response");
  });
});
