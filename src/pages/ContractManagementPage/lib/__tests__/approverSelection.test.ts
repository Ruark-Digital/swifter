import { describe, expect, test } from "vitest";
import {
  getPersonnelOptionLabel,
  getPersonnelRoleNames,
  isApproverPersonnel,
} from "../approverSelection";

describe("approverSelection helpers", () => {
  test("supports approvers with multiple roles", () => {
    const person = {
      _id: "person-1",
      firstName: "Ben",
      lastName: "White",
      email: "eng@ruarkdigital.com",
      role: [
        { _id: "role-1", name: "procurement" },
        { _id: "role-2", name: "approver" },
      ],
    };

    expect(isApproverPersonnel(person)).toBe(true);
    expect(getPersonnelRoleNames(person)).toEqual(["procurement", "approver"]);
    expect(getPersonnelOptionLabel(person)).toContain("Procurement");
    expect(getPersonnelOptionLabel(person)).toContain("Approver");
    expect(getPersonnelOptionLabel(person)).toContain("Ben White");
    expect(getPersonnelOptionLabel(person)).toContain("eng@ruarkdigital.com");
  });

  test("keeps non-approvers out of the pool", () => {
    const person = {
      _id: "person-2",
      email: "viewer@example.com",
      role: [{ _id: "role-1", name: "company_admin" }],
    };

    expect(isApproverPersonnel(person)).toBe(false);
  });
});
