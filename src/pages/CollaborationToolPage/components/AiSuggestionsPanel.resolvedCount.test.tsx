import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AiSuggestionsPanel from "./AiSuggestionsPanel";
import type { RedlineAcceptance } from "../collab/useAiRedlineSuggestions";

const noop = () => {};

const item = (id: string, accepted: RedlineAcceptance) => ({
  redline: { redlineId: id, kind: "insertion" as const, text: id },
  state: "approved" as const,
  accepted,
});

const renderPanel = (items: ReturnType<typeof item>[]) =>
  render(
    <AiSuggestionsPanel
      open
      status="ready"
      items={items}
      onApprove={noop}
      onDismiss={noop}
      onUndo={noop}
      onFocus={noop}
      onRetry={vi.fn()}
      // The BE total folds one-sided actions in: CM 63 + PM 7 = 70.
      progress={{ cm_accept: 63, pm_accept: 7, resolvedCount: 70, resolved: 70 }}
    />,
  );

// QA #185: "CM addressed: 63, PM addressed: 7, 70 resolved" on a PM who had
// just started — items awaiting the other side were counted as resolved.
describe("AiSuggestionsPanel resolved count (QA #185)", () => {
  it("counts only both-accepted items, not the BE one-sided total", () => {
    renderPanel([
      item("a", { status: "cm_accepted", cmAccepted: true }),
      item("b", { status: "vendor_accepted", vendorAccepted: true }),
      item("c", { status: "both_accepted", cmAccepted: true, vendorAccepted: true }),
    ]);
    expect(screen.getByText("CM addressed: 63")).toBeTruthy();
    expect(screen.getByText("PM addressed: 7")).toBeTruthy();
    expect(screen.getByText("1 resolved")).toBeTruthy();
    expect(screen.queryByText("70 resolved")).toBeNull();
  });
});
