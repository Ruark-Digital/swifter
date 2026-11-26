import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditEvaluationDialog from "../components/EditEvaluationDialog";

// QA N7: the Edit dialog prefilled the pickers with the stored instant read in
// the browser's zone, so with the browser on Lagos an Auckland evaluation
// starting 29 Nov 12:00 AM NZDT showed "Nov 28, 12:00 PM", and saving without
// changes moved both dates back 12 hours. Opening and re-saving must send the
// same wall clock in the evaluation's zone that Create sends.
// Run with TZ=Africa/Lagos.

const getRequestMock = vi.fn();
const putRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  postRequest: vi.fn(),
  putRequest: (...args: unknown[]) => putRequestMock(...args),
  deleteRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const evaluation = (timezone: string) => ({
  _id: "ev-1",
  status: "published",
  solicitation: { _id: "sol-1", name: "Harbour Bridge Works" },
  timezone,
  startDate: "2026-11-28T11:00:00.000Z", // 29 Nov 12:00 AM NZDT
  endDate: "2026-11-30T04:30:00.000Z", // 30 Nov 5:30 PM NZDT
  evaluators: [],
  requiredDocuments: [],
  criterias: [],
});

const openAndResave = async (
  timezone: string,
  page: "groups" | "criteria",
  button: RegExp,
) => {
  getRequestMock.mockImplementation(async ({ url }: { url: string }) =>
    url === "/procurement/evaluations/ev-1"
      ? { data: { data: evaluation(timezone) } }
      : { data: { data: [] } },
  );
  putRequestMock.mockResolvedValue({ data: { data: {} } });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <EditEvaluationDialog evaluationId="ev-1" page={page} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /edit evaluation/i }));
  await waitFor(() => expect(getRequestMock).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 300)); // let the stored values load
  fireEvent.click(await screen.findByRole("button", { name: button }));
  await waitFor(() => expect(putRequestMock).toHaveBeenCalled());
  const body = JSON.parse(JSON.stringify(putRequestMock.mock.calls[0][0].payload));
  console.log(`${page} resave body dates (${timezone}):`, body.start_date, body.end_date);
  return body;
};

describe("EditEvaluationDialog — open and re-save keeps the dates (browser on Lagos)", () => {
  afterEach(() => {
    getRequestMock.mockReset();
    putRequestMock.mockReset();
  });

  it("runs in a browser zone that is not the evaluation's", () => {
    expect(new Date(2026, 10, 29).getTimezoneOffset()).toBe(-60);
  });

  it.each(["NZST", "Pacific/Auckland"])(
    "Update Evaluation sends the unchanged Auckland wall clock (%s)",
    async (timezone) => {
      const body = await openAndResave(timezone, "criteria", /update evaluation/i);
      expect(body.start_date).toBe("2026-11-29T00:00:00");
      expect(body.end_date).toBe("2026-11-30T17:30:00");
    },
  );

  it("Save to Draft sends the unchanged Auckland wall clock", async () => {
    const body = await openAndResave("NZST", "groups", /save to draft/i);
    expect(body.start_date).toBe("2026-11-29T00:00:00");
    expect(body.end_date).toBe("2026-11-30T17:30:00");
  });
});
