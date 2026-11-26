import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CommentsTab from "./CommentsTab";

// N11: a reply typed with Shift+Enter must keep its line break when shown.
describe("comment line breaks", () => {
  it("keeps line breaks in a comment and its replies", () => {
    render(
      <CommentsTab
        avatarPublic=""
        comments={[
          {
            id: "c1",
            name: "Ada",
            timestamp: "t",
            message: "root one\nroot two",
            replies: [{ id: "r1", name: "Bob", timestamp: "t", message: "line one\nline two" }],
          },
        ]}
      />,
    );
    for (const text of ["root one\nroot two", "line one\nline two"]) {
      const el = screen.getByText(
        (_, node) => node?.classList.contains("ct-feed-message") === true && node.textContent === text,
      );
      // Collapsing white space (the browser default) would show "line one line two".
      expect(el.className).toContain("whitespace-pre-wrap");
    }
  });
});
