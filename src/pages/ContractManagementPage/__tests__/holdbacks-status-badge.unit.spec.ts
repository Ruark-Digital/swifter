import { test, expect } from "@playwright/test";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";

test.describe("holdbacks status badge helper", () => {
  test("maps known statuses to label + className", () => {
    expect(getHoldbackStatusBadgeProps("pending")).toEqual({
      label: "Pending",
      className: "bg-[#FEF9C3] text-[#CA8A04] hover:bg-[#FEF9C3]",
    });

    expect(getHoldbackStatusBadgeProps("approved")).toEqual({
      label: "Approved",
      className: "bg-[#EAF7EE] text-[#16A34A] hover:bg-[#EAF7EE]",
    });

    expect(getHoldbackStatusBadgeProps("rejected")).toEqual({
      label: "Rejected",
      className: "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]",
    });
  });

  test("handles missing/unknown status safely", () => {
    expect(getHoldbackStatusBadgeProps(undefined)).toEqual({
      label: "—",
      className: "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]",
    });

    expect(getHoldbackStatusBadgeProps("something_new")).toEqual({
      label: "Something New",
      className: "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]",
    });
  });
});
