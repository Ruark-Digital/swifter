import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Forge, useForge } from "@adexdsamson/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import Step2ContractTeam from "../components/Step2ContractTeam";
import { schema, type CreateContractFormData } from "../components/CreateContractSheet";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn().mockResolvedValue({ data: { data: [] } }),
}));
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => ({ isManager: false }) }));
vi.mock("@/store/authSlice", () => ({ useUser: () => ({ name: "CM" }) }));

// Mirrors the wizards: the real Step 2 inside a Forge using the shared schema,
// with a Continue button that validates step 2's fields like validateStep does.
// Create and Edit both render this same component and schema.
const Harness = () => {
  const { control, trigger, setValue } = useForge<CreateContractFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { projectManager: "" } as any,
  });
  return (
    <Forge control={control}>
      <Step2ContractTeam setValue={setValue} />
      <button
        type="button"
        onClick={() => void trigger(["projectManager"] as any)}
      >
        Continue
      </button>
    </Forge>
  );
};

describe("Step 2 — project manager required message", () => {
  it("renders 'Project Manager is required' under the field when Continue is clicked empty", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Harness />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("Project Manager is required")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Project Manager is required")).toBeTruthy();
  });
});
