import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import RfiTable from "../components/RfiTable";
import { postRequest } from "@/lib/axiosInstance";
import type { ContractRfis } from "@/types";

// Mutable role flags — default (all false) resolves to the contract-manager
// branch, matching the manager/plural-vs-singular parity under test.
const mockedUserRole = vi.hoisted(() => ({
  isApprover: false,
  isVendor: false,
  isProjectManager: false,
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockedUserRole,
}));

// Mutable "current user" — drives the issuer-identity gate (rfiIssuerId ===
// currentUser?._id) purely from the store, no real auth flow needed.
const mockedCurrentUser = vi.hoisted(() => ({ value: { _id: undefined as string | undefined } }));

vi.mock("@/store/authSlice", () => ({
  useUser: () => mockedCurrentUser.value,
  useSetReset: () => vi.fn(),
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

vi.mock("@/components/layouts/FormInputs", () => ({
  TextArea: () => null,
  TextDatePicker: () => null,
  TextFileUploader: () => null,
  TextInput: () => null,
  TextSelect: () => null,
}));

vi.mock("@/pages/ContractManagementPage/components/DocumentItem", () => ({
  DocumentItem: () => <div />,
}));

vi.mock("@/pages/SolicitationManagementPage/components/MessageComposer", () => ({
  default: () => <div data-testid="message-composer" />,
}));

// IssueRfiDialog itself is out of scope here (its submit flow lives in
// RfiTabContent.tsx and is not part of this quick task) — stub it so we can
// capture the exact basePath/mode/editPath wired into it by RfiTable.tsx.
vi.mock("../layouts/RfiTabContent", () => ({
  IssueRfiDialog: (props: { trigger: React.ReactNode; basePath?: string; mode?: string; editPath?: string }) => (
    <>
      {props.trigger}
      <div data-testid="issue-rfi-dialog-props">
        {JSON.stringify({ basePath: props.basePath, mode: props.mode, editPath: props.editPath })}
      </div>
    </>
  ),
}));

const mockedPostRequest = vi.mocked(postRequest);

const CONTRACT_ID = "contract-1";
const RFI_ID = "rfi-1";
const ISSUER_ID = "issuer-1";

const buildRfi = (overrides: Partial<ContractRfis> = {}): ContractRfis =>
  ({
    _id: RFI_ID,
    contractRef: CONTRACT_ID,
    contractRefModel: "Contract",
    company: "company-1",
    rfiId: "RFI-001",
    title: "Sample RFI",
    type: "issue",
    submittedBy: { _id: ISSUER_ID, name: "Issuer Person" } as any,
    description: "A question",
    deadline: undefined as any,
    status: "open",
    files: [],
    createdAt: undefined as any,
    updatedAt: undefined as any,
    __v: 0,
    ...overrides,
  }) as ContractRfis;

const renderTable = (rows: ContractRfis[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RfiTable
        rows={rows}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        setPagination={() => {}}
      />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("Contract RfiTable — close/edit gating and URL wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCurrentUser.value = { _id: undefined };
    Object.assign(mockedUserRole, {
      isApprover: false,
      isVendor: false,
      isProjectManager: false,
    });
    mockedPostRequest.mockResolvedValue({ data: { message: "RFI closed" } } as any);
  });

  test("issuer, status open: close button posts to singular /rfi/{id}/close", async () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    renderTable([buildRfi({ status: "open" })]);

    const trigger = screen.getByTestId("close-rfi-trigger");
    expect(trigger).toBeInTheDocument();

    const confirmButtons = screen
      .getAllByRole("button", { name: "Close RFI" })
      .filter((el) => el !== trigger);
    expect(confirmButtons.length).toBeGreaterThan(0);
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(mockedPostRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `/contract/manager/contracts/${CONTRACT_ID}/rfi/${RFI_ID}/close`,
        }),
      );
    });

    const calledUrl = mockedPostRequest.mock.calls[0][0].url as string;
    expect(calledUrl).not.toMatch(/\/rfis\//);
  });

  test("non-issuer: close button is absent", () => {
    mockedCurrentUser.value = { _id: "someone-else" };
    renderTable([buildRfi({ status: "open" })]);

    expect(screen.queryByTestId("close-rfi-trigger")).not.toBeInTheDocument();
  });

  test("issuer, status closed: close button is absent even for the issuer", () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    renderTable([buildRfi({ status: "closed" })]);

    expect(screen.queryByTestId("close-rfi-trigger")).not.toBeInTheDocument();
  });

  test("issuer, contract-manager role: edit dialog wired to plural /rfis base", () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    renderTable([buildRfi({ status: "open" })]);

    const propsEl = screen.getByTestId("issue-rfi-dialog-props");
    const parsed = JSON.parse(propsEl.textContent ?? "{}");
    expect(parsed.basePath).toBe(`/contract/manager/contracts/${CONTRACT_ID}/rfis`);
    expect(parsed.editPath).toBe(`/contract/manager/contracts/${CONTRACT_ID}/rfis/${RFI_ID}`);
  });

  test("issuer, approver role: edit dialog wired to singular /rfi base (no trailing s)", () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    Object.assign(mockedUserRole, { isApprover: true });
    renderTable([buildRfi({ status: "open" })]);

    const propsEl = screen.getByTestId("issue-rfi-dialog-props");
    const parsed = JSON.parse(propsEl.textContent ?? "{}");
    expect(parsed.basePath).toBe(`/contract/approver/contracts/${CONTRACT_ID}/rfi`);
    expect(parsed.editPath).toBe(`/contract/approver/contracts/${CONTRACT_ID}/rfi/${RFI_ID}`);
    expect(parsed.basePath).not.toMatch(/\/rfis$/);
  });
});

// QA #113 / v2.3.0: the Respond affordance follows the BE-authoritative,
// turn-aware `canRespond` flag — never the mere "assigned responder" identity —
// so it disappears once the caller has answered (the other party's turn) and
// appears for whoever owns the turn, INCLUDING the issuer replying to the
// responder's response.
describe("Contract RfiTable — respond-button turn-taking gate (QA #113)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCurrentUser.value = { _id: undefined };
    Object.assign(mockedUserRole, {
      isApprover: false,
      isVendor: false,
      isProjectManager: false,
    });
  });

  test("assigned responder (canRespond + isCurrentResponder) sees the Respond button", () => {
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        canRespond: true,
        isCurrentResponder: true,
      } as any),
    ]);
    expect(screen.getByTestId("respond-rfi")).toBeInTheDocument();
  });

  test("eligible responder on an unassigned RFI (isEligibleResponder) sees Respond", () => {
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        canRespond: true,
        isCurrentResponder: false,
        isEligibleResponder: true,
      } as any),
    ]);
    expect(screen.getByTestId("respond-rfi")).toBeInTheDocument();
  });

  test("responder who already answered (canRespond=false) does NOT see Respond (#3)", () => {
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        canRespond: false,
        isCurrentResponder: true,
        hasResponse: true,
      } as any),
    ]);
    expect(screen.queryByTestId("respond-rfi")).not.toBeInTheDocument();
  });

  // v2.3.0: the RFI is a two-way thread — the issuer responds to the responder's
  // response. The BE returns canRespond:true for the issuer ONLY on their turn,
  // so the issuer now sees Respond when it is their turn (canRespond:true), even
  // though both responder-role flags are false.
  test("issuer on their turn (canRespond:true) sees the Respond button", () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    renderTable([
      buildRfi({
        type: "issued",
        status: "open",
        canRespond: true,
        isCurrentResponder: false,
        isEligibleResponder: false,
      } as any),
    ]);
    expect(screen.getByTestId("respond-rfi")).toBeInTheDocument();
  });

  // ...but NOT while it is the responder's turn (canRespond:false), e.g. an
  // issued RFI awaiting the responder's first answer.
  test("issuer awaiting the responder (canRespond:false) does NOT see Respond", () => {
    mockedCurrentUser.value = { _id: ISSUER_ID };
    renderTable([
      buildRfi({
        type: "issued",
        status: "open",
        canRespond: false,
        isCurrentResponder: false,
        isEligibleResponder: false,
      } as any),
    ]);
    expect(screen.queryByTestId("respond-rfi")).not.toBeInTheDocument();
  });

  test("legacy payload (no canRespond flag): assigned, unanswered, open → Respond shows", () => {
    mockedCurrentUser.value = { _id: "responder-9" };
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        responder: "responder-9",
      } as any),
    ]);
    expect(screen.getByTestId("respond-rfi")).toBeInTheDocument();
  });

  // Turn guard (QA #114 #3): a responder who authored the latest thread message
  // must not keep the Respond button, even if a stale canRespond stays true.
  test("responder who authored the latest response does NOT see Respond (#114 #3)", () => {
    mockedCurrentUser.value = { _id: "responder-9" };
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        canRespond: true,
        isCurrentResponder: true,
        hasResponse: true,
        responseCount: 1,
        lastResponse: { submittedBy: { _id: "responder-9" } },
      } as any),
    ]);
    expect(screen.queryByTestId("respond-rfi")).not.toBeInTheDocument();
  });

  test("after the issuer replies last, the responder sees Respond again", () => {
    mockedCurrentUser.value = { _id: "responder-9" };
    renderTable([
      buildRfi({
        type: "received",
        status: "open",
        canRespond: true,
        isCurrentResponder: true,
        hasResponse: true,
        responseCount: 2,
        responder: "responder-9",
        lastResponse: { submittedBy: { _id: ISSUER_ID } },
      } as any),
    ]);
    expect(screen.getByTestId("respond-rfi")).toBeInTheDocument();
  });
});
