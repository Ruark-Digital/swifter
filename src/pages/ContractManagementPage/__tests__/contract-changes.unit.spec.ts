import { test, expect } from "@playwright/test";
import {
  changeTabToApiType,
  formatChangeTypeLabel,
  toContractChangeFileItem,
  toManagerCreateChangePayload,
} from "../lib/contractChanges";

test.describe("contractChanges helpers (unit)", () => {
  test("maps tab values to API type filters", async () => {
    expect(changeTabToApiType("all")).toBeUndefined();
    expect(changeTabToApiType("requests")).toBe("request");
    expect(changeTabToApiType("orders")).toBe("order");
    expect(changeTabToApiType("directive")).toBe("directive");
    expect(changeTabToApiType("proposal")).toBe("proposal");
  });

  test("formats change type labels", async () => {
    expect(formatChangeTypeLabel("request")).toBe("Request");
    expect(formatChangeTypeLabel("order")).toBe("Order");
    expect(formatChangeTypeLabel("directive")).toBe("Directive");
    expect(formatChangeTypeLabel("proposal")).toBe("Proposal");
  });

  test("builds manager create-change payload from dialog values", async () => {
    expect(
      toManagerCreateChangePayload({
        changeName: "Title",
        changeType: "proposal",
        urgency: "high",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
      type: "proposal",
      urgency: "high",
    });

    expect(
      toManagerCreateChangePayload({
        changeName: "Title",
        changeType: "request",
        urgency: "urgent",
        description: "Desc",
      })
    ).toEqual({
      title: "Title",
      description: "Desc",
    });
  });

  test("maps uploaded file response to contract file payload", async () => {
    const file = { name: "doc.pdf", size: 1234, type: "application/pdf" } as File;
    const uploaded = {
      name: "doc.pdf",
      url: "https://cdn.example.com/doc.pdf",
      type: "application/pdf",
      size: "1234",
      download: "https://cdn.example.com/doc.pdf?download=1",
    };

    expect(toContractChangeFileItem(file, uploaded)).toEqual({
      name: "doc.pdf",
      url: "https://cdn.example.com/doc.pdf",
      type: "application/pdf",
      size: 1234,
    });
  });
});
