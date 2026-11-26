import { describe, it, expect } from "vitest";
import { validateUploadFiles } from "../fileValidation";

const f = (name: string, size: number) =>
  ({ name, size }) as unknown as File;

describe("validateUploadFiles", () => {
  it("accepts a normal file", () => {
    const r = validateUploadFiles([f("a.pdf", 10)], []);
    expect(r.accepted).toHaveLength(1);
    expect(r.errors).toHaveLength(0);
  });
  it("rejects .exe", () => {
    const r = validateUploadFiles([f("a.exe", 10)], []);
    expect(r.accepted).toHaveLength(0);
    expect(r.errors[0]).toMatch(/not supported/);
  });
  it("rejects 0-byte files", () => {
    expect(validateUploadFiles([f("a.pdf", 0)], []).errors[0]).toMatch(/empty/);
  });
  it("rejects files over 50MB", () => {
    const r = validateUploadFiles([f("a.pdf", 57 * 1024 * 1024)], []);
    expect(r.errors[0]).toMatch(/50MB/);
  });
  it("rejects duplicates of existing and same-batch names", () => {
    const r = validateUploadFiles([f("A.pdf", 1), f("b.pdf", 1), f("b.pdf", 1)], ["a.pdf"]);
    expect(r.accepted.map((x) => x.name)).toEqual(["b.pdf"]);
    expect(r.errors).toHaveLength(2);
  });
});
