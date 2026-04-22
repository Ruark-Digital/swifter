import { test, expect } from "@playwright/test";
import { createCompanyAdminApi } from "../api/companyAdminApi";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<any>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => unknown): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return { data: impl ? impl(args) : {} } as any;
  };
  return { calls, fn };
};

test.describe("companyAdminApi (unit)", () => {
  test("passes request config headers to getContract", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const api = createCompanyAdminApi({ get: getSpy.fn });

    const config = { headers: { "x-role": "company_admin" } };
    await api.getContract("c-1", { config });

    expect(getSpy.calls.at(-1)).toEqual({
      url: "/user/contract/c-1",
      config,
    });
  });

  test("retries when request fails and retry is set", async () => {
    let attempts = 0;
    const api = createCompanyAdminApi({
      get: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("network");
        }
        return { data: { data: { _id: "c-2", title: "Retry Contract" } } } as any;
      },
    });

    const res = await api.getContract("c-2", { retry: 1 });
    expect(attempts).toBe(2);
    expect(res.data.data?._id).toBe("c-2");
  });

  test("surfaces error response status when retries are exhausted", async () => {
    const error = { response: { status: 403 } };
    const api = createCompanyAdminApi({
      get: async () => {
        throw error;
      },
    });

    await expect(api.getContract("c-3", { retry: 0 })).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
