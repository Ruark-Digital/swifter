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
    expect(getSpy.calls[0]).toEqual({ url: "/user/contract/c1" });
  });
});
