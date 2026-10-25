import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AiSuggestionsPanel from "./AiSuggestionsPanel";
import type { RedlineSpan } from "../collab/redlineScan";

const noop = () => {};

const renderItem = (redline: RedlineSpan) =>
  render(
    <AiSuggestionsPanel
      open
      status="ready"
      items={[{ redline, state: "pending" }]}
      onApprove={noop}
      onDismiss={noop}
      onUndo={noop}
      onFocus={noop}
      onRetry={vi.fn()}
    />,
  );

// QA #186: for a replacement, "Original" is the struck text and the inserted
// text is shown separately as the "Redline".
describe("AiSuggestionsPanel original vs redline (QA #186)", () => {
  it("shows the struck text as Original and the insertion as Redline", () => {
    renderItem({ redlineId: "r1", kind: "insertion", text: "45 days", originalText: "15 days" });
    expect(screen.getByText("Original").nextElementSibling?.textContent).toBe("15 days");
    expect(screen.getByText("Redline").nextElementSibling?.textContent).toBe("45 days");
  });

  it("keeps a single Original box for a plain redline", () => {
    renderItem({ redlineId: "r2", kind: "deletion", text: "old" });
    expect(screen.getByText("Original").nextElementSibling?.textContent).toBe("old");
    expect(screen.queryByText("Redline")).toBeNull();
  });
});
