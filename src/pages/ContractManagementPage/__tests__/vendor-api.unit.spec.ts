import { test, expect } from "@playwright/test";
import { createVendorApi } from "../api/vendorApi";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<{ data: unknown }>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => unknown): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return { data: impl ? impl(args) : {} };
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
    expect(getSpy.calls[0]).toEqual({ url: "contract/vendor/contracts/c1" });
  });

  test("change comments use Phase 2 vendor endpoints", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const postSpy = createAsyncSpy<{
      url: string;
      payload: unknown;
      config?: unknown;
    }>();

    const api = createVendorApi({
      get: getSpy.fn as any,
      post: postSpy.fn as any,
    });

    await api.listChangeComments("c1", "chg1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/vendor/contracts/c1/changes/chg1/comment",
    });

    const payload = { content: "hello" };
    await api.addChangeComment("c1", "chg1", payload);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/vendor/contracts/c1/changes/chg1/comment",
      payload,
    });
  });
});
