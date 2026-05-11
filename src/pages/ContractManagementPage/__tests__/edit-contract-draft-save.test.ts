import { describe, it, expect } from "vitest";
import {
  buildContractApproversPayload,
  resolveContractSaveStatus,
} from "../components/EditContract";
import { toPersonnelOrUndefined } from "../../../lib/contractFormValues";

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

  it("extracts approver ids from common option shapes", () => {
    const approvers = buildContractApproversPayload([
      {
        name: "Group A",
        approvers: [
          {
            id: "1549931019",
            text: "adediran.dbs+pm@gmail.com",
            meta: { email: "adediran.dbs+pm@gmail.com" },
          },
        ],
        approvalLevel: "",
        amount: "",
      },
      {
        name: "Group B",
        approvers: [
          {
            id: "507f1f77bcf86cd799439011",
            text: "Some User",
            meta: { email: "some.user@example.com" },
          },
        ],
        approvalLevel: "",
        amount: "",
      },
    ]);

    expect(approvers).toEqual([
      { user: ["adediran.dbs+pm@gmail.com"], groupName: "Group A", level: 1 },
      { user: ["507f1f77bcf86cd799439011"], groupName: "Group B", level: 2 },
    ]);
  });

  it("keeps draft status when contract status is draft", () => {
    expect(resolveContractSaveStatus("draft")).toBe("draft");
    expect(resolveContractSaveStatus("publish")).toBe("publish");
    expect(resolveContractSaveStatus("active")).toBe("publish");
    expect(resolveContractSaveStatus(null)).toBe("publish");
  });
});

describe("contractFormValues helpers", () => {
  it("prefers meta.email (or name) over non-email ids when mapping personnel", () => {
    expect(
      toPersonnelOrUndefined({
        text: "adediran.dbs+pm@gmail.com",
        id: "1549931019",
        meta: { email: "adediran.dbs+pm@gmail.com" },
      }),
    ).toEqual({ email: "adediran.dbs+pm@gmail.com" });

    expect(
      toPersonnelOrUndefined({
        text: "adediran.dbs+pm@gmail.com",
        id: "1549931019",
      }),
    ).toEqual({ email: "adediran.dbs+pm@gmail.com" });
  });
});
