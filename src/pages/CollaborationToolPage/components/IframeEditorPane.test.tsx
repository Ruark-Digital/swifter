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

const readyEvent = () =>
  new MessageEvent("message", {
    data: { type: "superdoc:ready" },
    origin: superdocOrigin(),
  });

describe("IframeEditorPane", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
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
      window.dispatchEvent(readyEvent());
    });

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      importMeta.sourceUrl,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const [msg, targetOrigin] = postMessage.mock.calls[0];
    expect(msg.type).toBe("superdoc:init");
    expect(msg.payload.roomId).toBe("room-1-superdoc");
    expect(targetOrigin).toBe(superdocOrigin());

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "superdoc:editor-ready", payload: { pageCount: 3 } },
          origin: superdocOrigin(),
        }),
      );
    });
    await waitFor(() => expect(onEditorReady).toHaveBeenCalled());
    const adapter = onEditorReady.mock.calls.map((c) => c[0]).find((a) => a);
    expect(adapter?.kind).toBe("superdoc");
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

  it("shows the HTTP status in the overlay when the document fetch is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }) as unknown as typeof fetch;

    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage: vi.fn() },
    });

    await act(async () => {
      window.dispatchEvent(readyEvent());
    });

    // Phase-aware overlay surfaces the actual failure instead of a generic message.
    const overlay = await screen.findByText(/Couldn't download the document \(HTTP 403\)/);
    expect(overlay).toBeTruthy();
  });

  it("calls onEditorReady(null) on unmount", () => {
    const onEditorReady = vi.fn();
    const { unmount } = render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={onEditorReady} />,
    );
    unmount();
    expect(onEditorReady).toHaveBeenLastCalledWith(null);
  });

  it("publishes a bridge-backed adapter: caches redlines, applies on replaceRedline", async () => {
    let adapter: any = null;
    render(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={(a) => { if (a) adapter = a; }}
      />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
      }));
    });
    await waitFor(() => expect(adapter).not.toBeNull());
    expect(adapter.kind).toBe("superdoc");

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:redlines", payload: { redlines: [{ redlineId: "r1", kind: "insertion", text: "x" }] } },
        origin: superdocOrigin(),
      }));
    });
    expect(adapter.extractRedlines()).toEqual([{ redlineId: "r1", kind: "insertion", text: "x" }]);

    adapter.replaceRedline("r1", "fixed");
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:apply-redline", payload: { redlineId: "r1", replacement: "fixed" } },
      superdocOrigin(),
    );
  });

  it("anchorComment posts add-comment and resolves with the created id", async () => {
    let adapter: any = null;
    render(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={collabMeta}
        onEditorReady={(a) => { if (a) adapter = a; }}
      />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
      }));
    });
    await waitFor(() => expect(adapter).not.toBeNull());

    const pending: Promise<string | null> = adapter.anchorComment("a note");
    const sent = postMessage.mock.calls.find((c) => c[0]?.type === "superdoc:add-comment");
    expect(sent).toBeTruthy();
    const requestId = sent![0].payload.requestId;
    expect(sent![0].payload.text).toBe("a note");

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", {
        data: { type: "superdoc:comment-created", payload: { requestId, commentId: "c9" } },
        origin: superdocOrigin(),
      }));
    });
    await expect(pending).resolves.toBe("c9");
  });

  it("anchorComment resolves null when the iframe never answers (timeout)", async () => {
    vi.useFakeTimers();
    try {
      let adapter: any = null;
      render(
        <IframeEditorPane
          importMeta={importMeta}
          collabMeta={collabMeta}
          onEditorReady={(a) => { if (a) adapter = a; }}
        />,
      );
      const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true, value: { postMessage: vi.fn() },
      });
      await act(async () => {
        window.dispatchEvent(new MessageEvent("message", {
          data: { type: "superdoc:editor-ready", payload: {} }, origin: superdocOrigin(),
        }));
      });
      expect(adapter).not.toBeNull();

      const pending: Promise<string | null> = adapter.anchorComment("a note");
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });
      await expect(pending).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails out of the rendering phase when the editor never reports ready (QA #286)", async () => {
    vi.useFakeTimers();
    try {
      const onError = vi.fn();
      render(
        <IframeEditorPane
          importMeta={importMeta}
          collabMeta={collabMeta}
          onEditorReady={vi.fn()}
          onError={onError}
        />,
      );
      const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
      const postMessage = vi.fn();
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true,
        value: { postMessage },
      });

      await act(async () => {
        window.dispatchEvent(readyEvent());
      });
      // Bytes posted — we are now in the (previously unbounded) rendering phase.
      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(46000);
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/the editor never finished opening it/i),
      ).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not fire the render watchdog once the editor reports ready", async () => {
    vi.useFakeTimers();
    try {
      const onError = vi.fn();
      render(
        <IframeEditorPane
          importMeta={importMeta}
          collabMeta={collabMeta}
          onEditorReady={vi.fn()}
          onError={onError}
        />,
      );
      const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true,
        value: { postMessage: vi.fn() },
      });

      await act(async () => {
        window.dispatchEvent(readyEvent());
      });
      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: { type: "superdoc:editor-ready", payload: {} },
            origin: superdocOrigin(),
          }),
        );
      });
      await act(async () => {
        vi.advanceTimersByTime(60000);
      });

      expect(onError).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops the live-collaboration wording when collaboration is disabled (QA #286)", async () => {
    const { rerender } = render(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={{ ...collabMeta, disable: true }}
        onEditorReady={vi.fn()}
      />,
    );
    expect(screen.queryByText(/live collaboration/i)).toBeNull();

    rerender(
      <IframeEditorPane
        importMeta={importMeta}
        collabMeta={{ ...collabMeta, disable: false }}
        onEditorReady={vi.fn()}
      />,
    );
    // Collaborative sessions keep the original wording.
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
    await act(async () => {
      window.dispatchEvent(readyEvent());
    });
    await waitFor(() =>
      expect(screen.getByText(/live collaboration/i)).toBeTruthy(),
    );
  });

  it("relays superdoc:selection as a ct-selection-change window event", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    const seen: any[] = [];
    const onSelection = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener("ct-selection-change", onSelection);
    try {
      await act(async () => {
        window.dispatchEvent(new MessageEvent("message", {
          data: { type: "superdoc:selection", payload: { hasSelection: true, excerpt: "quoted" } },
          origin: superdocOrigin(),
        }));
      });
      expect(seen).toEqual([{ hasSelection: true, excerpt: "quoted" }]);
    } finally {
      window.removeEventListener("ct-selection-change", onSelection);
    }
  });

  it("forwards ct-focus-comment and ct-focus-mark to the iframe", async () => {
    render(
      <IframeEditorPane importMeta={importMeta} collabMeta={collabMeta} onEditorReady={vi.fn()} />,
    );
    const iframe = screen.getByTitle("SuperDoc editor") as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", { configurable: true, value: { postMessage } });

    await act(async () => {
      window.dispatchEvent(new CustomEvent("ct-focus-comment", { detail: { commentId: "c1" } }));
      window.dispatchEvent(new CustomEvent("ct-focus-mark", { detail: { id: "r1" } }));
    });
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:focus-comment", payload: { commentId: "c1" } },
      superdocOrigin(),
    );
    expect(postMessage).toHaveBeenCalledWith(
      { type: "superdoc:focus-redline", payload: { redlineId: "r1" } },
      superdocOrigin(),
    );
  });
});
