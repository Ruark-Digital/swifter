import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLandingTabs } from "../useLandingTabs";
import type { Modules } from "@/types";

const modulesOn: Modules = {
  _id: "m", companyId: "c",
  contractManagement: true, solicitationManagement: true, evaluationsManagement: true,
  vendorManagement: true, reportsAnalytics: true, vendorsQA: true,
  generalUpdatesNotifications: true, addendumManagement: true, myActions: true,
  createdAt: new Date(), updatedAt: new Date(), __v: 0,
};

describe("useLandingTabs (hook integration)", () => {
  it("returns memoized tabs for procurement with flag on", () => {
    const { result, rerender } = renderHook(
      ({ role, modules }: { role: any; modules: Modules }) => useLandingTabs(role, modules),
      { initialProps: { role: "procurement" as const, modules: modulesOn } },
    );
    expect(result.current.map((t) => t.id)).toEqual(["solicitations", "contracts"]);
    const firstRef = result.current;
    rerender({ role: "procurement", modules: modulesOn });
    expect(result.current).toBe(firstRef); // memoization
  });

  it("recomputes when contractManagement flips", () => {
    const { result, rerender } = renderHook(
      ({ modules }: { modules: Modules }) => useLandingTabs("vendor", modules),
      { initialProps: { modules: modulesOn } },
    );
    expect(result.current.map((t) => t.id)).toEqual(["invitations", "contracts"]);
    rerender({ modules: { ...modulesOn, contractManagement: false } });
    expect(result.current.map((t) => t.id)).toEqual(["invitations"]);
  });

  it("company_admin with flag on returns [overview, contracts]", () => {
    const { result } = renderHook(
      () => useLandingTabs("company_admin", modulesOn),
    );
    expect(result.current.map((t) => t.id)).toEqual(["overview", "contracts"]);
  });

  it("vendor with flag off renders no contracts tab", () => {
    const { result } = renderHook(() =>
      useLandingTabs("vendor", { ...modulesOn, contractManagement: false }),
    );
    expect(result.current.map((t) => t.id)).toEqual(["invitations"]);
  });
});
