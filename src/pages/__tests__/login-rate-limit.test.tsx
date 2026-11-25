import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import { getAxiosInstance } from "@/lib/axiosInstance";

const toastMock = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Drive the real axios instance (interceptors included) with a rejecting adapter.
const rejectWith = (status: number, data: unknown) => {
  getAxiosInstance().defaults.adapter = async (config) => {
    throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
      status,
      statusText: "",
      data,
      headers: {},
      config: { ...config, headers: new AxiosHeaders() },
    });
  };
};

const submitLogin = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HelmetProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByPlaceholderText("Enter Email Address"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Password"), {
    target: { value: "secret" },
  });
  fireEvent.click(screen.getByTestId("login-button"));
};

describe("Login error toast", () => {
  beforeEach(() => toastMock.mockClear());

  it("shows the rate-limit message for a plain-text 429 body", async () => {
    rejectWith(429, "Too many request");
    await submitLogin();
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0]).toMatchObject({
      title: "Login Failed",
      description: "Too many attempts. Please wait a minute and try again.",
    });
  });

  it("shows the rate-limit message for a JSON 429 body", async () => {
    rejectWith(429, { message: "Too many request" });
    await submitLogin();
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0].description).toBe(
      "Too many attempts. Please wait a minute and try again.",
    );
  });

  it("keeps the server message for other errors", async () => {
    rejectWith(401, { message: "Invalid credentials" });
    await submitLogin();
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock.mock.calls[0][0].description).toBe("Invalid credentials");
  });
});
