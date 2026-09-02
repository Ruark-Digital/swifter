import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test, vi } from "vitest";
import ChangeTable from "../components/ChangeTable";

// ChangeTable reads the signed-in user's currency; nothing else is needed to
// render the (empty) table header under test.
vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ currency: "USD" }),
}));

// Regression (mobile overflow): the "Search changes" box used to be a fixed
// w-[260px], pushing the Change Management table past a phone viewport. It must
// be full-width on mobile and pin to 260px only at >=sm.
describe("ChangeTable — responsive search header", () => {
  test("search input is full-width on mobile, not a fixed 260px", () => {
    render(
      <ChangeTable
        contractId="c1"
        rows={[]}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        setPagination={() => {}}
      />
    );

    const input = screen.getByTestId("search-changes-input");
    const cls = input.className;

    expect(cls).toContain("w-full");
    expect(cls).toContain("sm:w-[260px]");
    // No bare (mobile) fixed 260px width that would overflow the viewport.
    expect(cls).not.toMatch(/(^|\s)w-\[260px\](\s|$)/);
  });
});
