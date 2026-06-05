import { describe, it, expect } from "vitest";
import {
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
} from "./superdocBridge";

const ORIGIN = "https://superdoc.example.com";

const evt = (data: unknown, origin = ORIGIN) =>
  ({ data, origin } as MessageEvent);

describe("superdocOrigin", () => {
  it("extracts the origin from an app url with a path", () => {
    expect(superdocOrigin("https://superdoc.example.com/app/")).toBe(ORIGIN);
  });
});

describe("parseSuperdocMessage", () => {
  it("rejects messages from a different origin", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:ready" }, "https://evil.com"), ORIGIN),
    ).toBeNull();
  });

  it("rejects non-object data", () => {
    expect(parseSuperdocMessage(evt("superdoc:ready"), ORIGIN)).toBeNull();
  });

  it("rejects unknown message types", () => {
    expect(parseSuperdocMessage(evt({ type: "other" }), ORIGIN)).toBeNull();
  });

  it("accepts superdoc:ready", () => {
    expect(parseSuperdocMessage(evt({ type: "superdoc:ready" }), ORIGIN)).toEqual({
      type: "superdoc:ready",
    });
  });

  it("accepts superdoc:doc-edit", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:doc-edit" }), ORIGIN),
    ).toEqual({ type: "superdoc:doc-edit" });
  });

  it("accepts superdoc:editor-ready with pageCount", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:editor-ready", payload: { pageCount: 12 } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:editor-ready", payload: { pageCount: 12 } });
  });

  it("drops a non-number pageCount from editor-ready", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:editor-ready", payload: { pageCount: "oops" } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:editor-ready", payload: { pageCount: undefined } });
  });

  it("accepts editor-ready with a missing payload", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:editor-ready" }), ORIGIN),
    ).toEqual({ type: "superdoc:editor-ready", payload: { pageCount: undefined } });
  });

  it("coerces a missing error message to a default string", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:error" }), ORIGIN),
    ).toEqual({ type: "superdoc:error", payload: { message: "Unknown error" } });
  });
});

describe("buildInitPayload", () => {
  it("namespaces the room id with :superdoc", () => {
    const bytes = new ArrayBuffer(8);
    const msg = buildInitPayload({
      docBytes: bytes,
      fileName: "deal.docx",
      fileType: "DOCX",
      documentMode: "editing",
      user: { name: "Ada", email: "ada@x.com" },
      roomId: "room-1",
      wsUrl: "ws://localhost:1234",
    });
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1:superdoc");
    expect(msg.payload.docBytes).toBe(bytes);
    expect(msg.payload.documentMode).toBe("editing");
  });
});
