import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

const setEditorValueMock = vi.fn();
const getEditorValueMock = vi.fn(() => ({}));

let seededImportState: Record<string, string> = {};
let latestYooptaOnChange:
  | ((value: unknown, options: { operations: unknown[] }) => void)
  | null = null;

const ensureLocalStorage = () => {
  const maybeStorage = (window as any).localStorage as unknown;
  if (maybeStorage && typeof (maybeStorage as any).setItem === "function") return;

  const store = new Map<string, string>();
  (window as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

vi.mock("@yoopta/editor", async () => {
  return {
    __esModule: true,
    default: ({
      children,
      onChange,
    }: {
      children?: ReactNode;
      onChange?: (value: unknown, options: { operations: unknown[] }) => void;
    }) => {
      latestYooptaOnChange = onChange ?? null;
      return <div data-testid="yoopta-editor">{children}</div>;
    },
    createYooptaMark: ({ type, hotkey, render }: { type: string; hotkey?: string; render: any }) => ({
      type,
      hotkey,
      render,
    }),
    createYooptaEditor: () => ({
      setEditorValue: setEditorValueMock,
      getEditorValue: getEditorValueMock,
      formats: {
        comment: {
          update: vi.fn(),
        },
      },
    }),
  };
});

vi.mock("../collab/useYooptaYjs", () => ({
  createCollab: () => ({
    wrapPluginsWithCollab: (plugins: unknown[]) => plugins,
    destroy: vi.fn(),
    setPresenceActive: vi.fn(),
    doc: {
      clientID: 1,
      getMap: () => {
        const store = new Map<string, string>(Object.entries(seededImportState));
        return {
          get: (key: string) => store.get(key),
          set: (key: string, value: string) => {
            store.set(key, value);
          },
          delete: (key: string) => {
            store.delete(key);
          },
        };
      },
    },
  }),
}));

const convertFileUrlToYooptaMock = vi.fn(async () => ({ block: "value" }));
vi.mock("@/lib/fileToYoopta", () => ({
  convertFileUrlToYoopta: (...args: unknown[]) =>
    convertFileUrlToYooptaMock(...(args as [unknown, ...unknown[]])),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("lucide-react", () => ({
  XIcon: () => <div />,
  History: () => <div />,
  RotateCcw: () => <div />,
  Save: () => <div />,
  MessageSquarePlus: () => <div />,
}));

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Page: () => <div />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
}));

import EditorPanel from "../components/EditorPanel";

describe("EditorPanel import", () => {
  beforeEach(() => {
    ensureLocalStorage();
    window.localStorage.clear();
    latestYooptaOnChange = null;
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("test harness provides localStorage", () => {
    expect(typeof window.localStorage.setItem).toBe("function");
  });

  it("rehydrates from local draft storage when the editor is empty", async () => {
    seededImportState = {};
    const roomId = "room-1";

    const draft = { blocks: [{ id: "b1" }] };
    const draftKey = `ct:draft:${roomId}`;
    window.localStorage.setItem(draftKey, JSON.stringify(draft));

    render(
      <EditorPanel
        importMeta={{
          sourceUrl: "https://example.com/doc.pdf",
          fileName: "doc.pdf",
          fileType: "application/pdf",
        }}
        collabMeta={{ wsUrl: "ws://localhost:1234", roomId }}
      />
    );

    await waitFor(() => {
      expect(setEditorValueMock).toHaveBeenCalledWith(draft);
    });
  });

  it("auto-saves to local draft storage after the user stops typing (2s debounce)", async () => {
    vi.useFakeTimers();
    seededImportState = { imported: "true" };
    const roomId = "room-1";

    const setItemSpy = vi.spyOn(window.localStorage, "setItem");

    render(
      <EditorPanel
        importMeta={{
          sourceUrl: "https://example.com/doc.pdf",
          fileName: "doc.pdf",
          fileType: "application/pdf",
        }}
        collabMeta={{ wsUrl: "ws://localhost:1234", roomId }}
      />
    );

    const draftValue = { value: "draft" };
    latestYooptaOnChange?.(draftValue, { operations: [] });

    await vi.advanceTimersByTimeAsync(1900);
    expect(setItemSpy).not.toHaveBeenCalledWith(
      `ct:draft:${roomId}`,
      JSON.stringify(draftValue)
    );

    await vi.advanceTimersByTimeAsync(200);
    expect(setItemSpy).toHaveBeenCalledWith(
      `ct:draft:${roomId}`,
      JSON.stringify(draftValue)
    );

    vi.useRealTimers();
  });

  it("imports even if the room was previously marked imported but the editor is empty", async () => {
    seededImportState = { imported: "true" };
    setEditorValueMock.mockClear();
    convertFileUrlToYooptaMock.mockClear();

    render(
      <EditorPanel
        importMeta={{
          sourceUrl: "https://example.com/doc.pdf",
          fileName: "doc.pdf",
          fileType: "application/pdf",
        }}
        collabMeta={{ wsUrl: "ws://localhost:1234", roomId: "room-1" }}
      />
    );

    await waitFor(() => {
      expect(convertFileUrlToYooptaMock).toHaveBeenCalled();
      expect(setEditorValueMock).toHaveBeenCalledWith({ block: "value" });
    });
  });

  it("imports a file into YooptaEditor when importMeta is provided", async () => {
    seededImportState = {};
    render(
      <EditorPanel
        importMeta={{
          sourceUrl: "https://example.com/doc.pdf",
          fileName: "doc.pdf",
          fileType: "application/pdf",
        }}
        collabMeta={{ wsUrl: "ws://localhost:1234", roomId: "room-1" }}
      />
    );

    await waitFor(() => {
      expect(convertFileUrlToYooptaMock).toHaveBeenCalled();
      expect(setEditorValueMock).toHaveBeenCalledWith({ block: "value" });
    });
  });
});
