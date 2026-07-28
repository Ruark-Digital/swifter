import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const h = vi.hoisted(() => ({ user: null as unknown }));

vi.mock("@/store/authSlice", () => {
  return { useUser: () => h.user };
});

vi.mock("@/config/dashboardConfig", () => {
  return { getDashboardConfig: () => ({}) };
});

import { useUserRole } from "../useUserRole";
import { __resetActiveRoleStoreForTests } from "../useActiveRole";

const Probe = () => {
  const { userRole } = useUserRole();
  return <div data-testid="role">{userRole}</div>;
};

const renderProbe = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>
  );
};

const role = (name: string) => ({ _id: `${name}-id`, name, __v: 0 });

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
    h.user = null;
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      configurable: true,
    });
    __resetActiveRoleStoreForTests();
  });

  it("defaults to view_only when no user and no persisted role exist", () => {
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("view_only");
  });

  it("uses persisted role from localStorage when available", () => {
    window.localStorage.setItem(
      "auth",
      JSON.stringify({ state: { user: { role: { name: "approver" } } } })
    );
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("approver");
  });

  it("single-role user resolves to that role (behavior unchanged)", () => {
    h.user = { _id: "u1", role: role("procurement") };
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("procurement");
  });

  it("multi-role user with no persisted choice picks the precedence default", () => {
    // approver precedes evaluator in the precedence order
    h.user = {
      _id: "u1",
      role: role("evaluator"),
      roles: [role("approver"), role("evaluator")],
    };
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("approver");
  });

  it("honors a persisted active role that is still in the set", () => {
    window.localStorage.setItem("activeRole:u1", "evaluator");
    h.user = {
      _id: "u1",
      role: role("approver"),
      roles: [role("approver"), role("evaluator")],
    };
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("evaluator");
  });

  it("resets to the default when the persisted active role is not in the set", () => {
    window.localStorage.setItem("activeRole:u1", "vendor");
    h.user = {
      _id: "u1",
      role: role("approver"),
      roles: [role("approver"), role("evaluator")],
    };
    renderProbe();
    expect(screen.getByTestId("role")).toHaveTextContent("approver");
  });
});
