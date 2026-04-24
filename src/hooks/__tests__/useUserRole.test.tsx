import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/store/authSlice", () => {
  return { useUser: () => null };
});

vi.mock("@/config/dashboardConfig", () => {
  return { getDashboardConfig: () => ({}) };
});

import { useUserRole } from "../useUserRole";

const Probe = () => {
  const { userRole } = useUserRole();
  return <div data-testid="role">{userRole}</div>;
};

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  } as Storage;
};

describe("useUserRole", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      configurable: true,
    });
  });

  it("defaults to view_only when no user and no persisted role exist", () => {
    render(<Probe />);
    expect(screen.getByTestId("role")).toHaveTextContent("view_only");
  });

  it("uses persisted role from localStorage when available", () => {
    window.localStorage.setItem(
      "auth",
      JSON.stringify({ state: { user: { role: { name: "approver" } } } }),
    );
    render(<Probe />);
    expect(screen.getByTestId("role")).toHaveTextContent("approver");
  });
});
