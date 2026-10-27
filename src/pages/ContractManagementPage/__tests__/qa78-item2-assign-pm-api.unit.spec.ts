import { describe, it, expect, vi } from "vitest";
import { createContractManagerApi } from "../api/contractManagerApi";

describe("qa78 item2 assign-pm api (unit)", () => {
  it("onboardProjectManager posts the email to the manager project-manager endpoint", async () => {
    const post = vi.fn().mockResolvedValue({ data: { message: "ok" } });
    const api = createContractManagerApi({
      get: vi.fn(),
      post,
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    });

    await api.onboardProjectManager("c1", { email: "pm@example.com" });

    expect(post).toHaveBeenCalledWith({
      url: "/contract/manager/contracts/c1/project-manager",
      payload: { email: "pm@example.com" },
    });
  });
});
