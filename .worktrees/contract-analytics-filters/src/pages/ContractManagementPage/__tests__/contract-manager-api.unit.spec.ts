import { test, expect } from "@playwright/test";
import { createContractManagerApi } from "../api/contractManagerApi";

type Spy<TArgs> = {
  calls: TArgs[];
  fn: (args: TArgs) => Promise<{ data: unknown }>;
};

const createAsyncSpy = <TArgs,>(impl?: (args: TArgs) => unknown): Spy<TArgs> => {
  const calls: TArgs[] = [];
  const fn = async (args: TArgs) => {
    calls.push(args);
    return { data: impl ? impl(args) : {} };
  };
  return { calls, fn };
};

test.describe("contractManagerApi (unit)", () => {
  test("validates request payloads before sending", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const postSpy = createAsyncSpy<{ url: string; payload: unknown; config?: unknown }>();
    const putSpy = createAsyncSpy<{ url: string; payload: unknown; config?: unknown }>();
    const deleteSpy = createAsyncSpy<{ url: string; payload?: unknown; config?: unknown }>();

    const api = createContractManagerApi({
      get: getSpy.fn,
      post: postSpy.fn,
      put: putSpy.fn,
      delete: deleteSpy.fn,
    });

    let createContractFailed = false;
    try {
      await api.createContract({ title: "T" } as never);
    } catch {
      createContractFailed = true;
    }
    expect(createContractFailed).toBe(true);
    expect(postSpy.calls.length).toBe(0);

    let approveClaimFailed = false;
    try {
      await api.approveClaim("cl1", {} as never);
    } catch {
      approveClaimFailed = true;
    }
    expect(approveClaimFailed).toBe(true);
    expect(postSpy.calls.length).toBe(0);
  });

  test("calls correct endpoints and passes payload/params", async () => {
    const getSpy = createAsyncSpy<{ url: string; config?: unknown }>();
    const postSpy = createAsyncSpy<{ url: string; payload: unknown; config?: unknown }>();
    const putSpy = createAsyncSpy<{ url: string; payload: unknown; config?: unknown }>();
    const deleteSpy = createAsyncSpy<{ url: string; payload?: unknown; config?: unknown }>();

    const api = createContractManagerApi({
      get: getSpy.fn,
      post: postSpy.fn,
      put: putSpy.fn,
      delete: deleteSpy.fn,
    });

    await api.listContracts();
    expect(getSpy.calls.at(-1)).toEqual({ url: "/contract/manager/contracts" });

    const createPayload = {
      title: "T",
      description: "D",
      category: "cat",
      timezone: "UTC",
      contractType: "hourly",
      contractRelationship: "standalone",
      rating: 5,
    };
    await api.createContract(createPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts",
      payload: createPayload,
    });

    await api.listPaymentHoldbacks("c1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c1/payment-holdbacks",
    });

    const holdbackPayload = { amount: 1 };
    await api.createPaymentHoldback("c1", holdbackPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c1/payment-holdbacks",
      payload: holdbackPayload,
    });

    await api.getPaymentHoldbackById("hb1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/payment-holdbacks/hb1",
    });

    await api.listPaymentSavings("c2");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c2/payment-savings",
    });

    const savingPayload = { title: "S" };
    await api.createPaymentSaving("c2", savingPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c2/payment-savings",
      payload: savingPayload,
    });

    await api.getPaymentSavingById("s1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/payment-savings/s1",
    });

    await api.getChangeStats("c3");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c3/changes/stats",
    });

    await api.listChanges("c3", { title: "x", type: "order", page: 2, limit: 10 });
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c3/changes",
      config: { params: { title: "x", type: "order", page: 2, limit: 10 } },
    });

    await api.getChangeDetail("chg1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/changes/chg1",
    });

    const changeCreatePayload = { title: "Change" };
    await api.createChangeRequest("d1", "Contract", changeCreatePayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/d1/change/Contract",
      payload: changeCreatePayload,
    });

    const approvalPayload = { action: "approved" };
    await api.approveChange("chg1", approvalPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/changes/chg1/approve",
      payload: approvalPayload,
    });

    await api.getChangeApproveStatus("chg1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/changes/chg1/approve/status",
    });

    await api.listChangeApprovers("chg1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/changes/chg1/approvers",
    });

    await api.listChangeComments("c2", "chg1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c2/changes/chg1/comments",
    });

    const commentPayload = { comment: "c" };
    await api.addChangeComment("c3", "chg1", commentPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c3/changes/chg1/comments",
      payload: commentPayload,
    });

    const replyPayload = { message: "r" };
    await api.replyChangeComment("c3", "chg1", "cm1", replyPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c3/changes/chg1/comments/cm1/reply",
      payload: replyPayload,
    });

    await api.getClaimStats("c4");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c4/claims/stats",
    });

    await api.listClaims("c4", { title: "t", type: "dispute", page: 1, limit: 5 });
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c4/claims",
      config: { params: { title: "t", type: "dispute", page: 1, limit: 5 } },
    });

    await api.getClaimDetail("cl1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1",
    });

    await api.approveClaim("cl1", approvalPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/approve",
      payload: approvalPayload,
    });

    await api.getClaimApproveStatus("cl1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/approve/status",
    });

    await api.listClaimComments("cl1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/comments",
    });

    await api.addClaimComment("cl1", "c4", commentPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/comments/c4",
      payload: commentPayload,
    });

    await api.replyClaimComment("cl1", "cm2", replyPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/comments/cm2/reply",
      payload: replyPayload,
    });

    await api.listClaimApprovers("cl1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/approvers",
    });

    const approversPayload = { userIds: ["u1", "u2"] };
    await api.sendClaimToApprovers("cl1", approversPayload);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/claims/cl1/approvers",
      payload: approversPayload,
    });

    await api.getInvoiceStats("c5");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c5/invoice/stats",
    });

    await api.listInvoices("c5", { invoiceId: "inv", page: 2, limit: 20 });
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c5/invoice",
      config: { params: { invoiceId: "inv", page: 2, limit: 20 } },
    });

    await api.getInvoiceDetail("inv1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/invoice/inv1",
    });

    await api.getAmendmentStats("c6");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c6/amendments/stats",
    });

    await api.listAmendments("c6");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c6/amendments",
    });

    const amendmentPayload = { title: "a" };
    await api.createAmendment("c6", amendmentPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c6/amendments",
      payload: amendmentPayload,
    });

    await api.getAmendmentDetail("a1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/amendments/a1",
    });

    const addApproversPayload = { approvers: ["u1"] };
    await api.addAmendmentApprovers("a1", addApproversPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/amendments/a1/approvers",
      payload: addApproversPayload,
    });

    await api.approveAmendment("a1", approvalPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/amendments/a1/approve",
      payload: approvalPayload,
    });

    const rfiPayload = { title: "rfi" };
    await api.createRfi("d2", rfiPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/d2/rfi",
      payload: rfiPayload,
    });

    await api.listRfis("c7", { title: "q", status: "open", page: 1, limit: 10 });
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c7/rfis",
      config: { params: { title: "q", status: "open", page: 1, limit: 10 } },
    });

    await api.getRfiDetail("c7", "rfi1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c7/rfis/rfi1",
    });

    const rfiRespPayload = { response: "ok" };
    await api.createRfiResponse("rfi1", rfiRespPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/rfis/rfi1/response",
      payload: rfiRespPayload,
    });

    await api.getRfiResponse("c7", "rfi1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c7/rfis/rfi1/response",
    });

    await api.listRfiComments("c8", "rfi1");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c8/rfis/rfi1/comment",
    });

    const rfiCommentPayload = { content: "c" };
    await api.addRfiComment("c8", "rfi1", rfiCommentPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c8/rfis/rfi1/comment",
      payload: rfiCommentPayload,
    });

    const rfiReplyPayload = { content: "r" };
    await api.replyRfiComment("rfi1", "cm1", rfiReplyPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/rfis/rfi1/comment/cm1/reply",
      payload: rfiReplyPayload,
    });

    await api.getContractCompliance("c9");
    expect(getSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c9/compliance",
    });

    const complianceApprovalPayload = { action: "approved", comment: "Looks good" };
    await api.approveComplianceItem("c9", "policy", "pol1", complianceApprovalPayload as never);
    expect(postSpy.calls.at(-1)).toEqual({
      url: "/contract/manager/contracts/c9/compliance/policy/pol1/approve",
      payload: complianceApprovalPayload,
    });

    // Test validation failure for approveComplianceItem
    let complianceApproveFailed = false;
    try {
      await api.approveComplianceItem("c9", "policy", "pol1", {} as never);
    } catch {
      complianceApproveFailed = true;
    }
    expect(complianceApproveFailed).toBe(true);
  });
});
