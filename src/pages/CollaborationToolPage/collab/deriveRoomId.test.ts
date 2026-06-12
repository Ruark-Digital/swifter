import { describe, it, expect } from "vitest";
import { deriveRoomId } from "./deriveRoomId";

describe("deriveRoomId", () => {
  it("keeps two contracts that share a document name independent", () => {
    const a = deriveRoomId({
      contractId: "contract-A",
      fileId: "file-1",
      fileName: "NDA.docx",
    });
    const b = deriveRoomId({
      contractId: "contract-B",
      fileId: "file-1",
      fileName: "NDA.docx",
    });
    expect(a).not.toBe(b);
  });

  it("returns the same room when the same contract reopens the same document", () => {
    const first = deriveRoomId({
      contractId: "contract-A",
      fileId: "file-1",
      fileName: "NDA.docx",
    });
    const second = deriveRoomId({
      contractId: "contract-A",
      fileId: "file-1",
      fileName: "NDA.docx",
    });
    expect(first).toBe(second);
  });

  it("lets an explicit ?doc= pin win over everything", () => {
    expect(
      deriveRoomId({
        collabDoc: "pinned-room",
        contractId: "contract-A",
        fileId: "file-1",
        fileName: "NDA.docx",
      }),
    ).toBe("pinned-room");
  });

  it("scopes by contract using fileName when no fileId is present", () => {
    expect(
      deriveRoomId({ contractId: "contract-A", fileName: "NDA.docx" }),
    ).toBe("contract-A:NDA.docx");
  });

  it("falls back to the document identifier when no contractId is supplied", () => {
    expect(deriveRoomId({ fileId: "file-1" })).toBe("file-1");
    expect(deriveRoomId({ fileName: "NDA.docx" })).toBe("NDA.docx");
  });

  it("falls back to the shared editor key when nothing identifies the document", () => {
    expect(deriveRoomId({})).toBe("collab:editor");
  });
});
