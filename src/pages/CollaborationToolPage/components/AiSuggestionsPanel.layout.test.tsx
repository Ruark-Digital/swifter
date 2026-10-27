import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AiSuggestionsPanel from "./AiSuggestionsPanel";

// QA #257: "The scrolling bar at the side of the redline got to the bottom but
// there were still more redlines". The inline panel shares its flex column
// with the turn banner. If its root claims `h-full` it takes the whole column
// height, pushing the tail of the suggestion list past the parent's
// overflow-hidden edge — unreachable, because the scrollbar it belongs to has
// already bottomed out.
const noop = () => {};

const renderInline = () =>
  render(
    <AiSuggestionsPanel
      open
      variant="inline"
      status="ready"
      items={[]}
      onApprove={noop}
      onDismiss={noop}
      onUndo={noop}
      onFocus={noop}
      onRetry={vi.fn()}
    />,
  );

describe("AiSuggestionsPanel inline layout (QA #257)", () => {
  it("sizes itself off the remaining column space, never the full height", () => {
    const { container } = renderInline();
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("flex-1");
    expect(root.className).toContain("min-h-0");
    // `h-full` beside a sibling banner is exactly the overflow bug.
    expect(root.className).not.toContain("h-full");
  });

  it("keeps the suggestion list as the scrolling element", () => {
    renderInline();
    // The list body owns overflow-y-auto; it can only engage when its
    // ancestors are allowed to shrink (min-h-0 above).
    const scroller = document.querySelector(".overflow-y-auto");

    expect(scroller).not.toBeNull();
    expect(scroller?.className).toContain("flex-1");
  });

  it("still renders as a fixed overlay in the default variant", () => {
    const { container } = render(
      <AiSuggestionsPanel
        open
        status="ready"
        items={[]}
        onApprove={noop}
        onDismiss={noop}
        onUndo={noop}
        onFocus={noop}
        onRetry={vi.fn()}
      />,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("fixed");
    expect(root.className).not.toContain("flex-1");
  });

  it("reports how many suggestions are still pending", () => {
    render(
      <AiSuggestionsPanel
        open
        variant="inline"
        status="ready"
        items={[
          { redline: { redlineId: "a", kind: "deletion", text: "x" }, state: "pending" },
          { redline: { redlineId: "b", kind: "deletion", text: "y" }, state: "pending" },
          { redline: { redlineId: "c", kind: "deletion", text: "z" }, state: "approved" },
        ] as never}
        onApprove={noop}
        onDismiss={noop}
        onUndo={noop}
        onFocus={noop}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("2 suggestions to review")).toBeInTheDocument();
  });
});

describe("AiSuggestionsPanel dual-approval request (other side must be able to act)", () => {
  // Regression: when one side approved a redline, the other side saw a
  // finished, button-less card. The other side must get an approve/reject
  // request. Driven by the BE-authoritative bilateral `accepted` state.
  const otherSideApproved = [
    {
      redline: { redlineId: "r1", kind: "insertion", text: "original text" },
      suggestion: {
        redlineId: "r1",
        assessment: "",
        suggestion: "Reject this limitation.",
        riskLevel: "low",
        alternativeLanguage: { medium: "Balanced replacement language." },
      },
      // The BE reports a manager-side accept awaiting the vendor:
      state: "approved",
      resolvedByHolder: "manager",
      accepted: { status: "cm_accepted", cmAccepted: true },
    },
  ] as never;

  it("shows the vendor an Approve & apply / Reject request for a CM-approved redline", () => {
    render(
      <AiSuggestionsPanel
        open
        variant="inline"
        status="ready"
        items={otherSideApproved}
        mySide="vendor"
        onApprove={noop}
        onDismiss={noop}
        onUndo={noop}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /approve & apply/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
    expect(screen.getByText(/approved this recommendation/i)).toBeInTheDocument();
  });

  it("invokes onApprove (the finalizing approval) when the vendor approves", () => {
    const onApprove = vi.fn();
    render(
      <AiSuggestionsPanel
        open
        variant="inline"
        status="ready"
        items={otherSideApproved}
        mySide="vendor"
        onApprove={onApprove}
        onDismiss={noop}
        onUndo={noop}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /approve & apply/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("tells the approving side it is awaiting the other, with no action button", () => {
    render(
      <AiSuggestionsPanel
        open
        variant="inline"
        status="ready"
        items={otherSideApproved}
        mySide="manager"
        onApprove={noop}
        onDismiss={noop}
        onUndo={noop}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/awaiting other side/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /approve & apply/i }),
    ).not.toBeInTheDocument();
  });
});
