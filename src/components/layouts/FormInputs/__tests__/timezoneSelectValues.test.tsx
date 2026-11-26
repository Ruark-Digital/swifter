import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import timezones from "@/assets/timezones.json";
import { TextSelect } from "../TextSelect";

// S1-FE-18: CST (America/Chicago, Asia/Shanghai) and AST (America/Halifax,
// Asia/Riyadh) share a stored value. Inside a <form>, Radix Select renders a
// hidden native <option> per item keyed by its value, so the select values
// themselves must be unique, while onChange still emits the stored value.
const duplicateKeyErrors = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls
    .map((args) => args.map(String).join(" "))
    .filter((msg) => msg.includes("same key"));

function Harness({ initial, onSave }: { initial?: string; onSave?: (v: string) => void }) {
  const [value, setValue] = useState<string | undefined>(initial);
  return (
    <form>
      <TextSelect
        name="timezone"
        options={timezones}
        value={value}
        onChange={(v: string) => {
          setValue(v);
          onSave?.(v);
        }}
      />
    </form>
  );
}

describe("TextSelect timezone picker in a form (S1-FE-18)", () => {
  afterEach(cleanup);

  it("renders unique native option values and logs no duplicate-key error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole("combobox"));
    const values = Array.from(container.querySelectorAll("select option")).map(
      (o) => (o as HTMLOptionElement).value,
    );
    const errors = duplicateKeyErrors(spy);
    spy.mockRestore();
    expect(values.length).toBeGreaterThanOrEqual(timezones.length);
    expect(new Set(values).size).toBe(values.length);
    expect(errors).toEqual([]);
  });

  it("saves Asia/Shanghai as the stored abbreviation CST and keeps it shown", () => {
    const onSave = vi.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Asia/Shanghai (CST, UTC+8)" }));
    expect(onSave).toHaveBeenCalledWith("CST");
    expect(screen.getByRole("combobox")).toHaveTextContent("Asia/Shanghai (CST, UTC+8)");
  });

  it("pre-selects a stored abbreviation (CST -> America/Chicago, NZST -> Auckland)", () => {
    render(<Harness initial="CST" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("America/Chicago (CST/CDT, UTC-6/-5)");
    cleanup();
    render(<Harness initial="NZST" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Pacific/Auckland");
  });
});
