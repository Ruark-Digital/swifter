import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditEvaluationDialog from "../components/EditEvaluationDialog";

// QA N3: editing a draft evaluation did not pre-fill the selected solicitation
// (the field was hidden, and the solicitations list leaves out solicitations
// that already have an evaluation, the draft's own included), so the timezone
// was not inherited from it either.

const getRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const evaluation = (status: string) => ({
  _id: "ev-1",
  status,
  solicitation: { _id: "sol-1", name: "Harbour Bridge Works" },
  timezone: "WAT",
  startDate: "2026-11-29T00:00:00.000Z",
  endDate: "2026-11-30T00:00:00.000Z",
  evaluators: [],
  requiredDocuments: [],
  criterias: [],
});

const mockApi = (status: string) =>
  getRequestMock.mockImplementation(async ({ url }: { url: string }) => {
    if (url === "/procurement/evaluations/ev-1")
      return { data: { data: evaluation(status) } };
    if (url === "/procurement/solicitations/sol-1")
      return { data: { data: { solicitation: { timezone: "NZDT" } } } };
    // The list never contains the draft's own solicitation.
    return { data: { data: [] } };
  });

const openDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <EditEvaluationDialog evaluationId="ev-1" page="overview" />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /edit evaluation/i }));
};

// [solicitation combo, timezone select] trigger buttons on step 1.
const triggers = () => screen.getAllByRole("combobox");

describe("EditEvaluationDialog — draft pre-fills its solicitation", () => {
  afterEach(() => getRequestMock.mockReset());

  it("shows the draft's solicitation and inherits its timezone", async () => {
    mockApi("draft");
    openDialog();

    // Solicitation: shown, pre-filled with the draft's own, not changeable.
    await waitFor(() => expect(triggers()[0]).toHaveTextContent("Harbour Bridge Works"));
    expect(triggers()[0]).toBeVisible();
    expect(triggers()[0]).toBeDisabled();
    // Timezone: inherited from the solicitation (NZDT maps to the NZST option).
    await waitFor(() => expect(triggers()[1]).toHaveTextContent("NZST (New Zealand Standard Time)"));
  });

  it("keeps a published evaluation's own timezone", async () => {
    mockApi("published");
    openDialog();

    await waitFor(() => expect(triggers()[1]).toHaveTextContent("WAT (West Africa Time)"));
    expect(getRequestMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: "/procurement/solicitations/sol-1" }),
    );
  });
});
