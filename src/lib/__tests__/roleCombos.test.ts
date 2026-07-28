import { describe, it, expect } from "vitest";
import {
  allowedComboNames,
  buildRoleOptions,
  filterOptionsByCombo,
  optionsFromUserRoles,
  partnerOf,
} from "../roleCombos";

const catalog = [
  { _id: "a1", name: "approver" },
  { _id: "e1", name: "evaluator" },
  { _id: "c1", name: "contract_manager" },
  { _id: "p1", name: "procurement" },
  { _id: "ca1", name: "company_admin" },
  { _id: "sa1", name: "super_admin" }, // restricted
  { _id: "pm1", name: "project_manager" }, // restricted
  { _id: "v1", name: "vendor" }, // restricted
];

describe("roleCombos", () => {
  it("knows the valid partners", () => {
    expect(partnerOf("approver")).toBe("evaluator");
    expect(partnerOf("evaluator")).toBe("approver");
    expect(partnerOf("contract_manager")).toBe("procurement");
    expect(partnerOf("procurement")).toBe("contract_manager");
    expect(partnerOf("company_admin")).toBeUndefined();
  });

  it("allows any role when nothing is selected", () => {
    expect(allowedComboNames([])).toBeNull();
  });

  it("restricts the second pick to the valid partner", () => {
    expect(allowedComboNames(["approver"])).toEqual(["approver", "evaluator"]);
    expect(allowedComboNames(["contract_manager"])).toEqual([
      "contract_manager",
      "procurement",
    ]);
  });

  it("locks to single when the first role has no partner", () => {
    expect(allowedComboNames(["company_admin"])).toEqual(["company_admin"]);
  });

  it("excludes restricted roles from the catalog options", () => {
    const options = buildRoleOptions(catalog);
    const names = options.map((o) => o.name);
    expect(names).toContain("approver");
    expect(names).toContain("company_admin");
    expect(names).not.toContain("super_admin");
    expect(names).not.toContain("project_manager");
    expect(names).not.toContain("vendor");
  });

  it("live-filters options to the valid partner after the first pick", () => {
    const options = buildRoleOptions(catalog);
    const visible = filterOptionsByCombo(options, ["a1"]); // approver selected
    const names = visible.map((o) => o.name).sort();
    expect(names).toEqual(["approver", "evaluator"]);
  });

  it("hydrates from populated role objects, ids, and slugs", () => {
    const options = buildRoleOptions(catalog);
    expect(
      optionsFromUserRoles([{ _id: "a1", name: "approver" }], null, options)
    ).toEqual([{ value: "a1", label: "APPROVER" }]);
    expect(optionsFromUserRoles(["c1"], null, options)).toEqual([
      { value: "c1", label: "CONTRACT MANAGER" },
    ]);
    expect(optionsFromUserRoles(["evaluator"], null, options)).toEqual([
      { value: "e1", label: "EVALUATOR" },
    ]);
    // falls back to the legacy singular role
    expect(
      optionsFromUserRoles(undefined, { _id: "p1", name: "procurement" }, options)
    ).toEqual([{ value: "p1", label: "PROCUREMENT" }]);
  });
});
