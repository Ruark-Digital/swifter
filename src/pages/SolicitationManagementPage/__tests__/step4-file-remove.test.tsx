import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

// jsdom's opaque (about:blank) origin leaves `localStorage` unavailable, which
// the store's zustand `persist` middleware needs. Polyfill it before the store
// module loads (vi.hoisted runs before the imports below).
vi.hoisted(() => {
  if (typeof globalThis.localStorage === "undefined" || globalThis.localStorage === null) {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => void store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  }
});

// forge only supplies setValue here; a stub keeps the test free of a real control.
vi.mock("@adexdsamson/forge", () => ({
  useForgeValues: () => ({ setValue: vi.fn() }),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/lib/axiosInstance", () => ({ postRequest: vi.fn() }));

import { FileUploadManager } from "../components/Step4Form";
import { solicitationFileSlice } from "@/store/solicitationFileSlice";

const existingDoc = {
  _id: "doc-1",
  name: "Swiftpro Contract Test Document.docx",
  url: "https://files.example/doc-1.docx",
  size: "12.59 MB",
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  originalName: "Swiftpro Contract Test Document.docx",
  fileName: "Swiftpro Contract Test Document.docx",
};

beforeEach(() => {
  // Reset the persisted Zustand store between tests.
  solicitationFileSlice.setState({ filesWithState: [], sessionId: null });
  try {
    localStorage.clear();
  } catch {
    /* jsdom without storage — ignore */
  }
});

describe("Solicitation Step 4 — remove uploaded document", () => {
  // Regression: removing a file reset the init flag (the unload-listener effect's
  // cleanup ran on every filesWithState.length change), so the "initialize
  // existing documents" effect re-added the just-removed document from the still-
  // populated `documents` prop. The remove button then appeared to do nothing.
  test("removing an existing document keeps it removed and does not re-add it", async () => {
    render(<FileUploadManager control={{}} documents={[existingDoc]} />);

    // The init effect hydrates the existing document into the list.
    await screen.findByText(existingDoc.name);

    fireEvent.click(screen.getByRole("button", { name: /remove file/i }));

    await waitFor(() => {
      expect(screen.queryByText(existingDoc.name)).not.toBeInTheDocument();
    });

    // Let effects settle — the buggy cleanup re-added the document here.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByText(existingDoc.name)).not.toBeInTheDocument();
    expect(solicitationFileSlice.getState().filesWithState).toHaveLength(0);
  });
});
