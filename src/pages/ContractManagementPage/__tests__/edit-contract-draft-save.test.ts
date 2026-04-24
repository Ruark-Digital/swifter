import { describe, it, expect } from "vitest";
import {
  buildContractApproversPayload,
  resolveContractSaveStatus,
} from "../components/EditContract";

describe("EditContract payload helpers", () => {
  it("filters out empty approval groups", () => {
    const approvers = buildContractApproversPayload([
      { name: "", approvers: [], approvalLevel: "", amount: "" },
      { name: "Group A", approvers: [], approvalLevel: "2", amount: "100" },
      { name: "", approvers: [{ value: "u1" }], approvalLevel: "1", amount: "100" },
    ]);

    expect(approvers).toEqual([]);
  });

  it("maps approval groups into API approvers shape", () => {
    const approvers = buildContractApproversPayload([
      {
        name: "Group A",
        approvers: [{ value: "u1" }, { value: "u2" }],
        approvalLevel: "",
        amount: "1000",
      },
    ]);

    expect(approvers).toEqual([
      { user: ["u1", "u2"], groupName: "Group A", level: 1, amount: 1000 },
    ]);
  });

  it("keeps draft status when contract status is draft", () => {
    expect(resolveContractSaveStatus("draft")).toBe("draft");
    expect(resolveContractSaveStatus("publish")).toBe("publish");
    expect(resolveContractSaveStatus("active")).toBe("publish");
    expect(resolveContractSaveStatus(null)).toBe("publish");
  });
});

