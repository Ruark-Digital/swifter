import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsFutureTime } from "../useIsFutureTime";

describe("useIsFutureTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("is false and does not loop for a start that already passed", () => {
    const past = Date.now() - 60_000;
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useIsFutureTime(past);
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(renders).toBe(1);
  });

  it("flips to false at the start instant for a future start", () => {
    const start = Date.now() + 5_000;
    const { result } = renderHook(() => useIsFutureTime(start));
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(5_100);
    });
    expect(result.current).toBe(false);
  });

  it("is false for undefined/NaN and clears its timer on unmount", () => {
    expect(renderHook(() => useIsFutureTime(undefined)).result.current).toBe(false);
    expect(renderHook(() => useIsFutureTime(NaN)).result.current).toBe(false);
    const { unmount } = renderHook(() => useIsFutureTime(Date.now() + 5_000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
