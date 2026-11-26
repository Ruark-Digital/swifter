import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CommentsTab, { type CommentsFeedItem } from "./CommentsTab";

const comment: CommentsFeedItem = {
  id: "c1",
  name: "Ada",
  timestamp: "1 Jan, 9:00 AM WAT",
  message: "Original text",
  canDelete: true,
};

const setup = () => {
  const onReply = vi.fn();
  const onEditComment = vi.fn();
  render(
    <CommentsTab
      avatarPublic=""
      comments={[comment]}
      onReply={onReply}
      onEditComment={onEditComment}
    />,
  );
  return { onReply, onEditComment };
};

describe("CommentsTab reply box keyboard", () => {
  it("sends the reply on Enter", () => {
    const { onReply } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const box = screen.getByPlaceholderText("Write a reply…");
    fireEvent.change(box, { target: { value: "Looks good" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onReply).toHaveBeenCalledWith("c1", "Looks good");
  });

  it("does not send on Shift+Enter (new line)", () => {
    const { onReply } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const box = screen.getByPlaceholderText("Write a reply…");
    fireEvent.change(box, { target: { value: "Line one" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onReply).not.toHaveBeenCalled();
  });

  it("does not send an empty reply on Enter", () => {
    const { onReply } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    const box = screen.getByPlaceholderText("Write a reply…");
    fireEvent.change(box, { target: { value: "   " } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onReply).not.toHaveBeenCalled();
  });
});

describe("CommentsTab edit box keyboard", () => {
  it("saves the edit on Enter and not on Shift+Enter", () => {
    const { onEditComment } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const box = screen.getByDisplayValue("Original text");
    fireEvent.change(box, { target: { value: "Changed text" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onEditComment).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onEditComment).toHaveBeenCalledWith("c1", "Changed text");
  });
});
