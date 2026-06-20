import { describe, it, expect } from "vitest";
import {
  buildAwardedOptions,
  buildContractApproversPayload,
  composeContractFiles,
  fileKey,
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

  it("keeps drafts as draft and routes everything else through pending_approval", () => {
    // Per commit dee2af6ff: edits to a non-draft contract re-enter the
    // approval workflow ("pending_approval") rather than publishing directly.
    expect(resolveContractSaveStatus("draft")).toBe("draft");
    expect(resolveContractSaveStatus("publish")).toBe("pending_approval");
    expect(resolveContractSaveStatus("active")).toBe("pending_approval");
    expect(resolveContractSaveStatus(null)).toBe("pending_approval");
  });
});

describe("composeContractFiles (QA #127 — draft documents disappearing on edit)", () => {
  const fileA = {
    _id: "a1",
    name: "A.pdf",
    url: "http://x/A.pdf",
    type: "application/pdf",
    size: "1 KB",
  };
  const fileB = {
    _id: "b2",
    name: "B.docx",
    url: "http://x/B.docx",
    type: "application/msword",
    size: "2 KB",
  };
  const upload = {
    name: "C.pdf",
    url: "http://x/C.pdf",
    type: "application/pdf",
    size: "3 KB",
  };

  it("keys a file by url, then _id, then name", () => {
    expect(fileKey(fileA)).toBe("http://x/A.pdf");
    expect(fileKey({ _id: "z9", name: "Z.pdf" })).toBe("z9");
    expect(fileKey({ name: "Z.pdf" })).toBe("Z.pdf");
  });

  it("retains existing files even when new uploads come through as null (the bug)", () => {
    expect(composeContractFiles([fileA, fileB], new Set(), null)).toEqual([
      { name: "A.pdf", url: "http://x/A.pdf", type: "application/pdf", size: "1 KB" },
      { name: "B.docx", url: "http://x/B.docx", type: "application/msword", size: "2 KB" },
    ]);
  });

  it("merges existing files with new uploads", () => {
    expect(composeContractFiles([fileA], new Set(), [upload])).toEqual([
      { name: "A.pdf", url: "http://x/A.pdf", type: "application/pdf", size: "1 KB" },
      { name: "C.pdf", url: "http://x/C.pdf", type: "application/pdf", size: "3 KB" },
    ]);
  });

  it("drops existing files the user removed (by url key)", () => {
    expect(
      composeContractFiles([fileA, fileB], new Set(["http://x/A.pdf"]), null),
    ).toEqual([
      { name: "B.docx", url: "http://x/B.docx", type: "application/msword", size: "2 KB" },
    ]);
  });

  it("dedupes a re-uploaded existing file by url", () => {
    expect(composeContractFiles([fileA], new Set(), [fileA])).toEqual([
      { name: "A.pdf", url: "http://x/A.pdf", type: "application/pdf", size: "1 KB" },
    ]);
  });
});

describe("buildAwardedOptions (QA #126 — awarded solicitation not retained on edit)", () => {
  const fetched = [
    {
      _id: "sol-available",
      name: "RFP Roadworks",
      vendor: { _id: "v1", name: "Acme", email: "a@acme.com" },
    },
  ];

  it("maps fetched awarded solicitations to labelled options", () => {
    expect(buildAwardedOptions(fetched, null, null)).toEqual([
      {
        label: "RFP Roadworks — Acme",
        value: "sol-available",
        vendorEmail: "a@acme.com",
        vendorId: "v1",
      },
    ]);
  });

  it("injects the contract's linked solicitation when the endpoint omits it", () => {
    const options = buildAwardedOptions(
      fetched,
      { _id: "sol-linked", name: "RFP Bridge" },
      { _id: "v9", name: "Zenith" },
    );
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({
      label: "RFP Bridge — Zenith",
      value: "sol-linked",
      vendorId: "v9",
    });
    expect(options[1].value).toBe("sol-available");
  });

  it("does not duplicate the linked solicitation if already in the fetched list", () => {
    const options = buildAwardedOptions(
      fetched,
      { _id: "sol-available", name: "RFP Roadworks" },
      { _id: "v1", name: "Acme" },
    );
    expect(options).toHaveLength(1);
    expect(options[0].value).toBe("sol-available");
  });

  it("skips injection when there is no linked solicitation", () => {
    expect(buildAwardedOptions(fetched, { _id: "", name: "" }, null)).toHaveLength(1);
    expect(buildAwardedOptions(fetched, undefined, undefined)).toHaveLength(1);
  });

  it("handles a linked solicitation passed as a bare id string", () => {
    const options = buildAwardedOptions(undefined, "sol-linked", null);
    expect(options).toEqual([
      { label: "Awarded Solicitation", value: "sol-linked" },
    ]);
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
