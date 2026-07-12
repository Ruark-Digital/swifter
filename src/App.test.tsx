import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseAuthentication, mockUseToken, mockUseUser } = vi.hoisted(() => ({
  mockUseAuthentication: vi.fn(),
  mockUseToken: vi.fn(),
  mockUseUser: vi.fn(),
}));

vi.mock("@/hooks/useAuthentication", () => ({
  useAuthentication: mockUseAuthentication,
}));

vi.mock("@/store/authSlice", () => ({
  useToken: mockUseToken,
  useUser: mockUseUser,
}));

vi.mock("./components/layouts/AIChatWidget", () => ({
  default: ({ welcomeMessage }: { welcomeMessage?: string }) => (
    <div data-testid="ai-chat-widget">{welcomeMessage}</div>
  ),
}));

vi.mock("./routes", () => ({
  routes: [],
}));

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    createBrowserRouter: vi.fn(() => ({})),
    RouterProvider: () => <div data-testid="router-provider" />,
  };
});

import App from "./App";

describe("App AI chat gating", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    mockUseAuthentication.mockReturnValue(true);
    mockUseToken.mockReturnValue("token");
    mockUseUser.mockReturnValue({ isAi: true, name: "Adebiran" });
  });

  it("shows the AI chat widget for authenticated AI-enabled users", () => {
    render(<App />);

    expect(screen.getByTestId("ai-chat-widget")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-widget")).toHaveTextContent(
      "Hi Adebiran, I'm the SwiftPro Assistant. Ask me about your contracts, solicitations, or evaluations.",
    );
  });

  it("hides the AI chat widget when the account is not AI-enabled", () => {
    mockUseUser.mockReturnValue({ isAi: false, name: "Adebiran" });

    render(<App />);

    expect(screen.queryByTestId("ai-chat-widget")).not.toBeInTheDocument();
  });
});
