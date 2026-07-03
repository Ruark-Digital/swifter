import { describe, expect, test } from "vitest";
import { buildDeliverableResponderOptions } from "../components/DeliverablesTable";

describe("buildDeliverableResponderOptions", () => {
  test("filters the vendor role out of deliverable responders, but keeps the Vendor PM (project manager)", () => {
    expect(
      buildDeliverableResponderOptions([
        {
          _id: "vendor-1",
          firstName: "Vendor",
          lastName: "User",
          role: [{ name: "Vendor" }],
        },
        {
          _id: "pm-1",
          firstName: "Project",
          lastName: "Manager",
          role: { name: "Project Manager" },
        },
        {
          _id: "pm-2",
          firstName: "Short",
          lastName: "PM",
          role: "pm",
        },
        {
          _id: "lead-1",
          firstName: "Procurement",
          lastName: "Lead",
          role: { name: "Procurement Lead" },
        },
        {
          _id: "cm-1",
          firstName: "Contract",
          lastName: "Manager",
          role: "Contract Manager",
        },
      ]),
    ).toEqual([
      { value: "pm-1", label: "Project Manager" },
      { value: "pm-2", label: "Short PM" },
      { value: "lead-1", label: "Procurement Lead" },
      { value: "cm-1", label: "Contract Manager" },
    ]);
  });
});
