import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { SendForApprovalDialog } from "../components/CreateContractSheet";

const groups = [
  {
    name: "Legal",
    approvalLevel: "1",
    approvers: [{ id: "a1", text: "Ada (ada@x.com)", meta: { name: "Ada", email: "ada@x.com" } }],
  },
  {
    name: "Finance",
    approvalLevel: "2",
    approvers: [{ id: "b1", text: "Bob (bob@x.com)", meta: { name: "Bob", email: "bob@x.com" } }],
  },
];

const Harness = ({ onSend }: { onSend: (s: string[]) => void }) => {
  const { control } = useForm({ defaultValues: { approvalGroups: groups } });
  return (
    <SendForApprovalDialog
      control={control}
      open
      onOpenChange={() => {}}
      onSendForApproval={onSend}
    />
  );
};

describe("SendForApprovalDialog group selection", () => {
  it("does not pre-select a group and blocks continuing until one is chosen", () => {
    render(<Harness onSend={vi.fn()} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByRole("option", { name: "Select Group" })).toBeTruthy();
    expect(screen.getByText("No approvers added for this group")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Continue to Review" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("enables continuing and lists the group's approvers once a group is chosen", () => {
    render(<Harness onSend={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Continue to Review" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
