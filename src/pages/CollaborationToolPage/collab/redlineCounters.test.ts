import { describe, expect, it } from "vitest";
import { deriveLocalAddressed, friendlyAiError } from "./useAiRedlineSuggestions";

describe("deriveLocalAddressed", () => {
  it("counts a side the moment its card flips", () => {
    expect(
      deriveLocalAddressed([
        { state: "pending" },
        { state: "approved", resolvedByHolder: "manager", accepted: { cmAccepted: true } },
        { state: "dismissed", resolvedByHolder: "vendor" },
        { state: "approved", accepted: { cmAccepted: true, vendorAccepted: true } },
      ]),
    ).toEqual({ cm: 2, pm: 2 });
  });
  it("drops back after an undo (state pending, acceptance cleared)", () => {
    expect(
      deriveLocalAddressed([{ state: "pending", resolvedByHolder: undefined }]),
    ).toEqual({ cm: 0, pm: 0 });
  });
});

describe("friendlyAiError", () => {
  it("hides raw axios 500 text", () => {
    const e = Object.assign(new Error("Request failed with status code 500"), {
      response: { status: 500 },
    });
    expect(friendlyAiError(e)).not.toMatch(/status code/);
    expect(friendlyAiError(e)).toMatch(/unavailable/i);
  });
  it("passes through a server message and returns undefined for no error", () => {
    expect(
      friendlyAiError({ response: { status: 422, data: { message: "Bad file" } } }),
    ).toBe("Bad file");
    expect(friendlyAiError(null)).toBeUndefined();
  });
});
