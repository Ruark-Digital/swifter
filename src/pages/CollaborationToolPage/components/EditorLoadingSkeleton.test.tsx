import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditorLoadingSkeleton from "./EditorLoadingSkeleton";

describe("EditorLoadingSkeleton", () => {
  it("shows the connecting status while connecting", () => {
    render(<EditorLoadingSkeleton phase="connecting" errorMsg="" />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByTestId("editor-skeleton-page")).toBeInTheDocument();
  });

  it("names live collaboration during the rendering phase", () => {
    render(<EditorLoadingSkeleton phase="rendering" errorMsg="" />);
    expect(screen.getByText(/live collaboration/i)).toBeInTheDocument();
  });

  it("renders a friendly error card on error", () => {
    render(<EditorLoadingSkeleton phase="error" errorMsg="Couldn't download the document (HTTP 403)." />);
    expect(screen.getByRole("alert")).toHaveTextContent("HTTP 403");
    expect(screen.queryByTestId("editor-skeleton-page")).not.toBeInTheDocument();
  });

  it("offers a Try again button on error that calls onRetry", () => {
    const onRetry = vi.fn();
    render(<EditorLoadingSkeleton phase="error" errorMsg="boom" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the Try again button when no onRetry is given", () => {
    render(<EditorLoadingSkeleton phase="error" errorMsg="boom" />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
