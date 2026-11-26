import { afterEach, describe, expect, it } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAxiosInstance } from "@/lib/axiosInstance";
import { storeFunctions } from "@/store/authSlice";
import { clearSessionExpired, isSessionExpiredFlagged } from "@/lib/sessionExpiry";

// S2-FE-18: a 401 while signed in must leave a note for the login page.
const reply401 = async (config: InternalAxiosRequestConfig) => {
  throw new AxiosError("Unauthorized", "401", config, null, {
    status: 401,
    statusText: "Unauthorized",
    data: {},
    headers: {},
    config,
  });
};

describe("session expiry flag", () => {
  afterEach(() => {
    clearSessionExpired();
    storeFunctions.getState().setReset();
  });

  it("is set when a signed-in request gets a 401", async () => {
    storeFunctions.getState().setToken("t");
    await expect(getAxiosInstance().get("/x", { adapter: reply401 })).rejects.toBeTruthy();
    expect(isSessionExpiredFlagged()).toBe(true);
    expect(storeFunctions.getState().token).toBeNull();
  });

  it("is not set for a 401 with no session (a failed login)", async () => {
    await expect(getAxiosInstance().post("/auth/login", {}, { adapter: reply401 })).rejects.toBeTruthy();
    expect(isSessionExpiredFlagged()).toBe(false);
  });
});
