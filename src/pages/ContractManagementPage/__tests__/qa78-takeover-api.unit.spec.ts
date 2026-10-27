import { describe, it, expect, vi } from "vitest";
import { createVendorApi } from "../api/vendorApi";
import { createContractManagerApi } from "../api/contractManagerApi";

describe("qa78 take-over api (unit)", () => {
  it("requestContractTakeOver posts to the vendor assign endpoint", async () => {
    const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
    const api = createVendorApi({ get: vi.fn(), post });
    await api.requestContractTakeOver("c1", "pm1");
    expect(post).toHaveBeenCalledWith({
      url: "/contract/vendor/contracts/c1/project-managers/pm1/assign",
    });
  });

  it("approveProjectManagerAssignment posts action + reason", async () => {
    const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
    const api = createContractManagerApi({
      get: vi.fn(),
      post,
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    });
    await api.approveProjectManagerAssignment("c1", {
      action: "rejected",
      reason: "no",
    });
    expect(post).toHaveBeenCalledWith({
      url: "/contract/manager/contracts/c1/project-manager/approval",
      payload: { action: "rejected", reason: "no" },
    });
  });
});
