import { test, expect } from "@playwright/test";
import { createViewOnlyApi } from "../api/viewOnlyApi";
import type { ApiResponse } from "@/types";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<ApiResponse<any>>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => ApiResponse<any>): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return impl ? impl(args) : ({ data: { data: {} } } as any);
  };
  return { calls, fn };
};

test.describe("viewOnlyApi (unit)", () => {
  test("getContract calls correct endpoint", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();

    const api = createViewOnlyApi({
      get: getSpy.fn as any,
    });

    await api.getContract("c1");
    expect(getSpy.calls[0]).toEqual({ url: "/contract/user/contracts/c1" });
  });

  // QA #102/#103 — the list + stats must hit the read-only `/user/contracts`
  // surface (the manager endpoints 403 for view-only, and there is no `/me`).
  test("listContracts hits /contract/user/contracts with pagination", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const api = createViewOnlyApi({ get: getSpy.fn as any });

    await api.listContracts({ page: 2, limit: 10 });
    expect(getSpy.calls[0]).toEqual({
      url: "/contract/user/contracts",
      config: { params: { page: 2, limit: 10 } },
    });
  });

  test("listContracts omits config when no query is given", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const api = createViewOnlyApi({ get: getSpy.fn as any });

    await api.listContracts();
    expect(getSpy.calls[0]).toEqual({ url: "/contract/user/contracts" });
  });

  test("getStats hits /contract/user/contracts/stats", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const api = createViewOnlyApi({ get: getSpy.fn as any });

    await api.getStats();
    expect(getSpy.calls[0]).toEqual({ url: "/contract/user/contracts/stats" });
  });
});
