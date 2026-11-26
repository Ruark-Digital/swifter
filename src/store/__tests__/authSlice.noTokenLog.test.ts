import { afterEach, describe, expect, it, vi } from "vitest";
import { authSlice } from "../authSlice";

// N10: the auth store must never print tokens to the console.
describe("authSlice logging", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not log the access or refresh token when they are set", () => {
    const spies = (["log", "info", "debug", "warn"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {})
    );
    const state = authSlice.getState();
    state.setToken("eyJ.secret-access-token");
    state.setRefreshToken("secret-refresh-token");

    const printed = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    expect(printed).not.toContain("secret-access-token");
    expect(printed).not.toContain("secret-refresh-token");
    state.setReset();
  });
});
