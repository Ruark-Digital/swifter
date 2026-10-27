import { describe, it, expect } from "vitest";
import { deriveRoomId } from "./deriveRoomId";

describe("deriveRoomId", () => {
  it("keys by the document id, ignoring the contract", () => {
    // The room is the document's own id (`fileId`); the contract is not part
    // of the key, so the same document resolves to the same room regardless of
    // which contract context it's opened from.
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
    expect(a).toBe("file-1");
    expect(b).toBe("file-1");
  });

  it("returns the same room when the same document is reopened", () => {
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

  it("uses fileName as the document key when no fileId is present", () => {
    expect(
      deriveRoomId({ contractId: "contract-A", fileName: "NDA.docx" }),
    ).toBe("NDA.docx");
  });

  it("falls back to the document identifier when no contractId is supplied", () => {
    expect(deriveRoomId({ fileId: "file-1" })).toBe("file-1");
    expect(deriveRoomId({ fileName: "NDA.docx" })).toBe("NDA.docx");
  });

  it("falls back to the shared editor key when nothing identifies the document", () => {
    expect(deriveRoomId({})).toBe("collab:editor");
  });
});
