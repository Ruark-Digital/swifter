import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
