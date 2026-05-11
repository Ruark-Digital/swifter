import { describe, expect, it } from "vitest";
import { toFileMetaOrUndefined } from "../contractFormValues";

describe("toFileMetaOrUndefined", () => {
  it("returns undefined when required fields are missing", () => {
    expect(toFileMetaOrUndefined({ name: "a.pdf" })).toBeUndefined();
  });

  it("normalizes numeric sizes to string", () => {
    expect(
      toFileMetaOrUndefined({
        name: "a.pdf",
        url: "https://cdn.example.com/a.pdf",
        type: "application/pdf",
        size: 204800,
      }),
    ).toEqual({
      name: "a.pdf",
      url: "https://cdn.example.com/a.pdf",
      type: "application/pdf",
      size: "204800",
    });
  });

  it("keeps string sizes as strings", () => {
    expect(
      toFileMetaOrUndefined({
        name: "a.pdf",
        url: "https://cdn.example.com/a.pdf",
        type: "application/pdf",
        size: "204800",
      }),
    ).toEqual({
      name: "a.pdf",
      url: "https://cdn.example.com/a.pdf",
      type: "application/pdf",
      size: "204800",
    });
  });
});

