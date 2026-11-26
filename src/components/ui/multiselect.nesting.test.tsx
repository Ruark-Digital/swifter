import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MultipleSelector, { type Option } from "./multiselect";

// Contract wizard Step 8 approvers field (QA item a): a chosen approver renders
// a chip whose remove "x" is a <button>, so the field itself must not be one.
// cmdk scrolls the active option into view; jsdom has no layout.
Element.prototype.scrollIntoView ??= () => {};

const apple: Option = { label: "Apple Approver", value: "u1" };
const options: Option[] = [apple, { label: "Berry Approver", value: "u2" }];

const setup = () => {
  const onValueChange = vi.fn();
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<MultipleSelector options={options} value={[apple]} onValueChange={onValueChange} />);
  return { onValueChange, errors };
};

describe("MultipleSelector with a selected value", () => {
  it("does not nest a button inside a button", () => {
    const { errors } = setup();
    const nestingWarnings = errors.mock.calls.filter((c) =>
      /cannot be a descendant of|cannot contain a nested/i.test(c.map(String).join(" ")),
    );
    errors.mockRestore();
    expect(document.querySelectorAll("button button")).toHaveLength(0);
    expect(nestingWarnings).toEqual([]);
  });

  it("removes a chip by mouse, without opening the field", () => {
    const { onValueChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove Apple Approver" }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("combobox").getAttribute("aria-expanded")).toBe("false");
  });

  it("removes a chip by keyboard, without opening the field", () => {
    const { onValueChange } = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Remove Apple Approver" }), { key: "Enter" });
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("combobox").getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on click and on Enter, Space or ArrowDown", () => {
    setup();
    const field = screen.getByRole("combobox");
    expect(field.getAttribute("tabindex")).toBe("0");
    fireEvent.click(field);
    expect(field.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(field);
    for (const key of ["Enter", " ", "ArrowDown"]) {
      fireEvent.keyDown(field, { key });
      expect(field.getAttribute("aria-expanded")).toBe("true");
      fireEvent.keyDown(field, { key: "Escape" });
    }
  });
});
