import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Forge, useForge } from "@adexdsamson/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import Step2ContractTeam from "../components/Step2ContractTeam";
import {
  MSA_STEP_VALIDATION_FIELDS,
  schema,
  type CreateMsaFormData,
} from "../layouts/CreateMSADialog";

vi.mock("@/lib/axiosInstance", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/axiosInstance")>()),
  getRequest: vi.fn().mockResolvedValue({ data: { data: [] } }),
}));
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => ({ isManager: false }) }));
vi.mock("@/store/authSlice", () => ({ useUser: () => ({ name: "CM" }) }));

// The real Step 2 inside a Forge using the dialog's schema; Continue validates
// the same field list the dialog's validateStep uses (create and edit share it).
const Harness = ({ pm, onResult }: { pm: string; onResult: (ok: boolean) => void }) => {
  const { control, trigger, setValue } = useForge<CreateMsaFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { projectManager: pm } as any,
  });
  return (
    <Forge control={control}>
      <Step2ContractTeam />
      <button
        type="button"
        onClick={async () =>
          onResult(await trigger(MSA_STEP_VALIDATION_FIELDS[2] as any))
        }
      >
        Continue
      </button>
      <button type="button" onClick={() => setValue("projectManager", "")}>
        noop
      </button>
    </Forge>
  );
};

const renderStep = (pm: string, onResult = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness pm={pm} onResult={onResult} />
    </QueryClientProvider>,
  );
  return onResult;
};

describe("MSA step 2 — project manager required", () => {
  it("renders 'Project Manager is required' and blocks Continue when empty", async () => {
    const onResult = renderStep("");
    expect(screen.queryByText("Project Manager is required")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Project Manager is required")).toBeTruthy();
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("lets Continue through with a project manager (id or typed email)", async () => {
    for (const pm of ["64b7f0c2a1d4e5f6a7b8c9d0", "pm@example.com"]) {
      const onResult = renderStep(pm);
      fireEvent.click(screen.getAllByRole("button", { name: "Continue" }).at(-1)!);
      await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    }
    expect(screen.queryByText("Project Manager is required")).toBeNull();
  });
});
