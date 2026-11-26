import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import timezones from "@/assets/timezones.json";
import { TextSelectWithSearch } from "../TextSelectWithSearch";
import { TextSelect } from "../TextSelect";

// S1-FE-18: CST (Chicago/Shanghai) and AST (Halifax/Riyadh) share a stored
// value, so keying options by value gave React duplicate keys.
const duplicateKeyErrors = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls
    .map((args) => args.map(String).join(" "))
    .filter((msg) => msg.includes("same key"));

describe("timezone pickers: option keys are unique (S1-FE-18)", () => {
  afterEach(cleanup);

  it("TextSelectWithSearch logs no duplicate-key error and lists Shanghai and Riyadh", () => {
    Element.prototype.scrollIntoView ??= () => {};
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TextSelectWithSearch name="timezone" options={timezones} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Asia/Shanghai (CST, UTC+8)")).toBeInTheDocument();
    expect(screen.getByText("Asia/Riyadh (AST, UTC+3)")).toBeInTheDocument();
    const errors = duplicateKeyErrors(spy);
    spy.mockRestore();
    expect(errors).toEqual([]);
  });

  it("TextSelect logs no duplicate-key error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TextSelect name="timezone" options={timezones} open />);
    const errors = duplicateKeyErrors(spy);
    spy.mockRestore();
    expect(errors).toEqual([]);
  });
});
