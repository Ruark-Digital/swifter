import { test, expect } from "@playwright/test";
import { createVendorApi } from "../api/vendorApi";
import { ApiResponse, ContractDetail } from "@/types";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<ApiResponse<ContractDetail>>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => ApiResponse<ContractDetail>): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return impl ? impl(args) : ({ data: { data: {} } } as any);
  };
  return { calls, fn };
};

test.describe("vendorApi (unit)", () => {
  test("getContract calls correct endpoint", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();

    const api = createVendorApi({
      get: getSpy.fn as any,
    });

    await api.getContract("c1");
    expect(getSpy.calls[0]).toEqual({ url: "/vendor/contract/c1" });
  });
});
