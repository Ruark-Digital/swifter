import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SubmitProposalPage from "../components/SubmitProposalPage";

const getRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  postRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ currency: "USD" }),
}));

vi.mock("@/components/layouts/ConfirmAlert", () => ({
  ConfirmAlert: () => null,
}));

const renderPage = () => {
  // Default query options on purpose: the page itself must opt out of retries.
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dashboard/solicitations/sol-1/submit-proposal"]}>
        <Routes>
          <Route
            path="/dashboard/solicitations/:id/submit-proposal"
            element={<SubmitProposalPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("SubmitProposalPage — criteria not assigned", () => {
  afterEach(() => getRequestMock.mockReset());

  it("shows the not-open state right after view-criteria 404s (no retry backoff)", async () => {
    getRequestMock.mockRejectedValue({
      response: {
        status: 404,
        data: { message: "Criteria have not been assigned to this solicitation yet" },
      },
    });
    renderPage();
    expect(
      await screen.findByText("This solicitation is not open for proposals yet", {}, { timeout: 1500 }),
    ).toBeTruthy();
    expect(getRequestMock).toHaveBeenCalledTimes(1);
  });

  it("renders the normal submit page when criteria exist", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        data: {
          solicitation: { name: "Road Works", status: "active", solId: "SOL-1", typeId: {} },
          documents: [],
        },
      },
    });
    renderPage();
    expect(await screen.findByText(/Submit Proposal - Road Works/)).toBeTruthy();
    expect(screen.queryByText("This solicitation is not open for proposals yet")).toBeNull();
  });
});
