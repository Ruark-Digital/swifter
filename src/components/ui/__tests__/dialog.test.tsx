// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "../dialog";

describe("DialogContent", () => {
  it("stays open when interacting with portaled Radix popper content", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Project</DialogTitle>
          <div data-radix-popper-content-wrapper>
            <button type="button">Select option</button>
          </div>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Select option" }));

    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
