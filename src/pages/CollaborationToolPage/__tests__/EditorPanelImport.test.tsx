import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

const setEditorValueMock = vi.fn();
const getEditorValueMock = vi.fn(() => ({}));

vi.mock("@yoopta/editor", async () => {
  return {
    __esModule: true,
    default: ({ children }: { children?: ReactNode }) => (
      <div data-testid="yoopta-editor">{children}</div>
    ),
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
        const store = new Map<string, string>();
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

const convertFileUrlToYooptaMock = vi.fn(async (..._args: unknown[]) => ({ block: "value" }));
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
}));

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Page: () => <div />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
}));

import EditorPanel from "../components/EditorPanel";

describe("EditorPanel import", () => {
  it("imports a file into YooptaEditor when importMeta is provided", async () => {
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
