import { test, expect } from "@playwright/test";
import { createApproverApi } from "../api/approverApi";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<any>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => any): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return impl ? impl(args) : ({ data: { data: {} } } as any);
  };
  return { calls, fn };
};

test.describe("approverApi (unit)", () => {
  test("getContract calls correct endpoint", async () => {
    const getSpy = createAsyncSpy<{ url: string }>();
    const api = createApproverApi({
      get: getSpy.fn,
      post: async () => ({}) as any,
    });

    await api.getContract("c1");
    expect(getSpy.calls[0]).toEqual({ url: "/contract/approver/contracts/c1" });
  });

  test("getApproveStatus calls correct endpoint", async () => {
    const getSpy = createAsyncSpy<{ url: string }>();
    const api = createApproverApi({
      get: getSpy.fn,
      post: async () => ({}) as any,
    });

    await api.getApproveStatus("c1");
    expect(getSpy.calls[0]).toEqual({
      url: "/contract/approver/contracts/c1/approve/status",
    });
  });

  test("approveContract calls correct endpoint", async () => {
    const postSpy = createAsyncSpy<{ url: string; payload: any }>();
    const api = createApproverApi({
      get: async () => ({}) as any,
      post: postSpy.fn,
    });

    const payload = { action: "approved" as const, comment: "Looks good" };
    await api.approveContract("c1", payload);
    expect(postSpy.calls[0]).toEqual({
      url: "/contract/approver/contracts/c1/approve",
      payload,
    });
  });
});
