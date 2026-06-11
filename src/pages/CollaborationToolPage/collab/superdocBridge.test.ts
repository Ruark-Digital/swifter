import { describe, it, expect } from "vitest";
import {
  resolveSuperdocAppUrl,
  superdocOrigin,
  parseSuperdocMessage,
  buildInitPayload,
  buildApplyRedline,
  buildFocusRedline,
  buildAddComment,
  buildFocusComment,
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

  it("accepts superdoc:redlines and coerces the array", () => {
    const r = [{ redlineId: "r1", kind: "insertion", text: "hi" }];
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redlines", payload: { redlines: r } }), ORIGIN),
    ).toEqual({ type: "superdoc:redlines", payload: { redlines: r } });
  });

  it("defaults superdoc:redlines to an empty array when missing", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redlines" }), ORIGIN),
    ).toEqual({ type: "superdoc:redlines", payload: { redlines: [] } });
  });

  it("accepts superdoc:redline-clicked", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:redline-clicked", payload: { redlineId: "r1" } }), ORIGIN),
    ).toEqual({ type: "superdoc:redline-clicked", payload: { redlineId: "r1" } });
  });

  it("rejects superdoc:redline-clicked with no redlineId", () => {
    expect(parseSuperdocMessage(evt({ type: "superdoc:redline-clicked", payload: {} }), ORIGIN)).toBeNull();
  });

  it("accepts superdoc:presence and keeps valid users", () => {
    const users = [
      { clientId: 2, name: "Ada", avatarUrl: "a.png" },
      { clientId: 3, name: "Grace" },
    ];
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:presence", payload: { users } }), ORIGIN),
    ).toEqual({
      type: "superdoc:presence",
      payload: {
        users: [
          { clientId: 2, name: "Ada", avatarUrl: "a.png" },
          { clientId: 3, name: "Grace", avatarUrl: undefined },
        ],
      },
    });
  });

  it("drops malformed presence entries and defaults missing users to []", () => {
    const users = [
      { clientId: "nope", name: "Bad" },
      { clientId: 4, name: 99 },
      { clientId: 5, name: "Ok" },
    ];
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:presence", payload: { users } }), ORIGIN),
    ).toEqual({
      type: "superdoc:presence",
      payload: { users: [{ clientId: 5, name: "Ok", avatarUrl: undefined }] },
    });
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:presence" }), ORIGIN),
    ).toEqual({ type: "superdoc:presence", payload: { users: [] } });
  });
});

describe("buildInitPayload", () => {
  it("namespaces the room id with -superdoc", () => {
    const bytes = new ArrayBuffer(8);
    const msg = buildInitPayload({
      docBytes: bytes,
      fileName: "deal.docx",
      fileType: "DOCX",
      documentMode: "editing",
      user: { name: "Ada", email: "ada@x.com" },
      roomId: "room-1",
      wsUrl: "ws://localhost:1234",
      token: "tok-xyz",
    });
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1-superdoc");
    expect(msg.payload.docBytes).toBe(bytes);
    expect(msg.payload.documentMode).toBe("editing");
  });
});

describe("redline command builders", () => {
  it("buildApplyRedline", () => {
    expect(buildApplyRedline("r1", "new text")).toEqual({
      type: "superdoc:apply-redline",
      payload: { redlineId: "r1", replacement: "new text" },
    });
  });
  it("buildFocusRedline", () => {
    expect(buildFocusRedline("r1")).toEqual({
      type: "superdoc:focus-redline",
      payload: { redlineId: "r1" },
    });
  });
});

describe("resolveSuperdocAppUrl", () => {
  it("returns the configured url when set", () => {
    expect(resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: "https://editor.swiftpro.tech", PROD: true }))
      .toBe("https://editor.swiftpro.tech");
  });
  it("falls back to localhost in dev when unset", () => {
    expect(resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: undefined, PROD: false }))
      .toBe("http://localhost:5174");
  });
  it("throws in production when unset", () => {
    expect(() => resolveSuperdocAppUrl({ VITE_SUPERDOC_APP_URL: undefined, PROD: true }))
      .toThrow(/VITE_SUPERDOC_APP_URL/);
  });
});

describe("buildInitPayload token + room", () => {
  const base = {
    docBytes: new ArrayBuffer(8),
    fileName: "a.docx",
    fileType: "docx",
    documentMode: "editing" as const,
    user: { name: "A", email: "a@b.c" },
    roomId: "room123",
    wsUrl: "wss://api.swiftpro.tech/api/v1/dev/contract",
    token: "jwt-abc",
  };

  it("forwards the token verbatim", () => {
    expect(buildInitPayload(base).payload.token).toBe("jwt-abc");
  });

  it("namespaces the room with a colon-free, single-segment suffix", () => {
    const room = buildInitPayload(base).payload.roomId;
    expect(room).toBe("room123-superdoc");
    expect(room).not.toContain(":");
  });
});

describe("anchored-comment messages", () => {
  it("accepts superdoc:selection", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } });
  });

  it("coerces a malformed superdoc:selection payload", () => {
    expect(parseSuperdocMessage(evt({ type: "superdoc:selection" }), ORIGIN)).toEqual({
      type: "superdoc:selection",
      payload: { hasSelection: false, excerpt: "" },
    });
  });

  it("accepts superdoc:comment-created with a string or null commentId", () => {
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: "c1" } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: "c1" } });
    expect(
      parseSuperdocMessage(
        evt({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: null } }),
        ORIGIN,
      ),
    ).toEqual({ type: "superdoc:comment-created", payload: { requestId: "q1", commentId: null } });
  });

  it("rejects superdoc:comment-created without a requestId", () => {
    expect(
      parseSuperdocMessage(evt({ type: "superdoc:comment-created", payload: { commentId: "c1" } }), ORIGIN),
    ).toBeNull();
  });

  it("builds add-comment and focus-comment commands", () => {
    expect(buildAddComment("q1", "hello")).toEqual({
      type: "superdoc:add-comment",
      payload: { requestId: "q1", text: "hello" },
    });
    expect(buildFocusComment("c1")).toEqual({
      type: "superdoc:focus-comment",
      payload: { commentId: "c1" },
    });
  });
});
