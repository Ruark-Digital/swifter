import { test, expect } from "@playwright/test";
import {
  buildExpiryWarningLine,
  buildPendingApprovalLine,
  buildRfiAlertLine,
  extractAlertItemNumber,
  formatAlertEntityLabel,
  isApprovalDelayed,
  isInsurancePolicyType,
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

  test("classifies only COI as an insurance policy — securities are not", async () => {
    expect(isInsurancePolicyType("COI")).toBe(true);
    expect(isInsurancePolicyType("coi")).toBe(true);
    expect(isInsurancePolicyType("certificate_of_insurance")).toBe(true);
    // Contract securities are never insurance.
    expect(isInsurancePolicyType("contractSecurity")).toBe(false);
    expect(isInsurancePolicyType("letter_of_credit")).toBe(false);
    expect(isInsurancePolicyType("bank_guarantee")).toBe(false);
    expect(isInsurancePolicyType("performance_bond")).toBe(false);
    expect(isInsurancePolicyType("")).toBe(false);
    expect(isInsurancePolicyType(undefined)).toBe(false);
  });

  test("prefixes expiry lines by category — COI is insurance, contractSecurity is security", async () => {
    // COI → insurance warning.
    expect(
      buildExpiryWarningLine({ category: "COI", label: "COI", daysToExpiry: 18 })
    ).toBe("Insurance warning: COI (expires in 18 days)");
    // Contract securities → security warning (never "Insurance warning").
    expect(
      buildExpiryWarningLine({
        category: "contractSecurity",
        label: "letter_of_credit",
        daysToExpiry: 2,
      })
    ).toBe("Security warning: letter of credit (expires in 2 days)");
    expect(
      buildExpiryWarningLine({
        category: "contractSecurity",
        label: "bank_guarantee",
        daysToExpiry: 12,
      })
    ).toBe("Security warning: bank guarantee (expires in 12 days)");
    expect(
      buildExpiryWarningLine({
        category: "contractSecurity",
        label: "performance_bond",
        daysToExpiry: 25,
      })
    ).toBe("Security warning: performance bond (expires in 25 days)");
    // No expiry count → no trailing parens.
    expect(
      buildExpiryWarningLine({ category: "COI", label: "COI" })
    ).toBe("Insurance warning: COI");
  });
});
