import { describe, it, expect } from "vitest";
import { getBlobErrorMessage } from "../blobErrorMessage";

const blobError = (body: string) => ({
  response: { data: new Blob([body], { type: "application/json" }) },
});

describe("getBlobErrorMessage", () => {
  it("reads the server message from a JSON Blob error body", async () => {
    await expect(
      getBlobErrorMessage(blobError('{"status":"fail","message":"Proposal not found"}')),
    ).resolves.toBe("Proposal not found");
  });

  it("returns undefined when the Blob body is not JSON", async () => {
    await expect(getBlobErrorMessage(blobError("<html>502</html>"))).resolves.toBeUndefined();
  });

  it("still reads a plain JSON error body", async () => {
    await expect(
      getBlobErrorMessage({ response: { data: { message: "Forbidden" } } }),
    ).resolves.toBe("Forbidden");
  });

  it("returns undefined for a network error with no response", async () => {
    await expect(getBlobErrorMessage(new Error("Network Error"))).resolves.toBeUndefined();
  });
});
