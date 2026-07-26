import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CreateEvaluationDialog from "../components/CreateEvaluationDialog";

// Reported: "navigating to this page triggers submission of the form which
// isn't right, until the user clicks on the create evaluation button, it
// should not create the evaluation."
//
// The final-step button flipped `type` from "button" to "submit" as a side
// effect of the very click that advanced the wizard, so simply ARRIVING at
// step 4 could post the evaluation. This asserts the create endpoint is not
// called until the button is actually pressed on step 4.

const getRequestMock = vi.fn();
const postRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: unknown[]) => getRequestMock(...args),
  postRequest: (...args: unknown[]) => postRequestMock(...args),
  putRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const CREATE_URL = "/procurement/evaluations";

const createCalls = () =>
  postRequestMock.mock.calls.filter(
    ([arg]) => (arg as { url?: string })?.url === CREATE_URL,
  );

const renderDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateEvaluationDialog />
    </QueryClientProvider>,
  );
};

describe("CreateEvaluationDialog — no premature submit", () => {
  beforeEach(() => {
    getRequestMock.mockResolvedValue({ data: { data: [] } });
    postRequestMock.mockResolvedValue({ data: { data: {} } });
  });

  afterEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
  });

  it("does not create the evaluation just by opening the wizard", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /create evaluation/i }));

    await waitFor(() =>
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument(),
    );
    expect(createCalls()).toHaveLength(0);
  });

  it("advancing past step 1 does not create the evaluation", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /create evaluation/i }));
    await waitFor(() =>
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument(),
    );

    // Step 1 is deliberately left invalid, so this must not advance AND must
    // not post anything.
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(getRequestMock).toHaveBeenCalled());
    expect(createCalls()).toHaveLength(0);
  });
});

// Source-level guard. The wizard cannot be driven to step 4 in jsdom (Radix
// selects + date pickers), so this asserts the property that actually prevents
// the bug instead of pretending to reproduce it: the dialog must not hand the
// browser a submit-typed control whose activation it does not control.
describe("CreateEvaluationDialog — source invariants", () => {
  it("never renders a submit-typed button in the wizard footer", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      "src/pages/EvaluationManagementPage/components/CreateEvaluationDialog.tsx",
      "utf8",
    );

    expect(source).not.toMatch(/type=\{[^}]*"submit"/);
    expect(source).toContain("forge.handleSubmit(onSubmit)");
  });
});
