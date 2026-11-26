import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// S1-FE-08: the enabled "Confirm Intent" row action must not be forced grey.
describe("Confirm Intent menu action styling", () => {
  it("does not force disabled-looking grey classes on the trigger button", () => {
    const src = readFileSync(path.resolve(__dirname, "../index.tsx"), "utf-8");
    const labelAt = src.indexOf('"Confirm Intent"');
    expect(labelAt).toBeGreaterThan(-1);
    const trigger = src.slice(src.lastIndexOf("<Button", labelAt), labelAt);
    expect(trigger).not.toContain("!text-gray-600");
    expect(trigger).not.toContain("opacity-50");
    // Only greyed out when genuinely disabled (Button's disabled: styles).
    expect(trigger).toContain("disabled={isConfirmingSolicitation}");
  });
});
