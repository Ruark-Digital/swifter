import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import IframeEditorPane from "./IframeEditorPane";
import { superdocOrigin } from "../collab/superdocBridge";

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ name: "Ada", email: "ada@x.com" }),
}));
vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

const importMeta = { sourceUrl: "https://files.x.com/a.docx", fileName: "a.docx", fileType: "DOCX" };
const collabMeta = { wsUrl: "ws://localhost:1234", roomId: "room-1", token: "", disable: false, presenceActive: false };

describe("IframeEditorPane", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("on superdoc:ready, fetches the doc and posts an init message into the iframe", async () => {
    const onEditorReady = vi.fn();
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={onEditorReady} />,
    );

    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage },
    });

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:ready" },
          origin: superdocOrigin(),
        }),
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(importMeta.sourceUrl);
      expect(postMessage).toHaveBeenCalledTimes(1);
    });
    const [msg, targetOrigin] = postMessage.mock.calls[0];
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1:superdoc");
    expect(targetOrigin).toBe(superdocOrigin());

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:editor-ready", payload: { pageCount: 3 } },
          origin: superdocOrigin(),
        }),
      );
    });
    await waitFor(() => expect(onEditorReady).toHaveBeenCalledWith(null));
  });

  it("ignores messages from an untrusted origin", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:ready" },
          origin: "https://evil.com",
        }),
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
