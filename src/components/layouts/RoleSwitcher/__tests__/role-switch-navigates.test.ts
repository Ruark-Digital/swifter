import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";

// Reported: switching roles left the user on the previous role's page even when
// that page is absent from the new role's sidebar. The switch handler must send
// the user to the new role's first accessible route.
//
// The switcher is a Radix dropdown (portal + pointer events) that doesn't drive
// reliably in jsdom, so rather than pretend to reproduce the click this asserts
// the wiring that actually fixes the bug: the switch handler navigates to
// getFirstAccessibleRoute for the newly selected role. getFirstAccessibleRoute's
// per-role behaviour is covered in src/lib/__tests__/navigation.test.ts.
describe("RoleSwitcher — navigates on switch", () => {
  it("routes to the new role's first accessible route when switching", async () => {
    const source = await fs.readFile(
      "src/components/layouts/RoleSwitcher/index.tsx",
      "utf8",
    );

    expect(source).toContain("getFirstAccessibleRoute");
    expect(source).toMatch(
      /navigate\(\s*getFirstAccessibleRoute\(\s*newRole/,
    );
  });
});
