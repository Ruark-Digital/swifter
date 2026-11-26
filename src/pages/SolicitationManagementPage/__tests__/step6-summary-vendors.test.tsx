import { render, screen } from "@testing-library/react";
import Step6Form from "../components/Step6Form";
import type { CreateSolicitationFormData } from "../components/CreateSolicitationDialog";

// S1-FE-09: a public solicitation has no invited vendors, so the step 6
// summary must not list "5. Invited Vendors"; invite-only keeps it.

const renderSummary = (visibility: "public" | "invite-only") =>
  render(
    <Step6Form
      formData={
        {
          name: "Harbour Bridge Works",
          visibility,
          vendor: [{ label: "Acme Ltd", value: "v-1" }],
        } as unknown as CreateSolicitationFormData
      }
      setStep={vi.fn()}
      solicitationTypes={[]}
      categoryOptions={[]}
    />,
  );

describe("Step6Form summary — Invited Vendors section", () => {
  it("is hidden for a public solicitation", () => {
    renderSummary("public");
    expect(screen.getByText("4. Uploaded Documents")).toBeInTheDocument();
    expect(screen.queryByText(/Invited Vendors/)).not.toBeInTheDocument();
  });

  it("is shown for an invite-only solicitation", () => {
    renderSummary("invite-only");
    expect(screen.getByText("5. Invited Vendors")).toBeInTheDocument();
  });
});
