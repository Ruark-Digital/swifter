// Reported pattern (QA #293/#294 evaluation, solicitation Create/Edit): the
// primary footer button of a multi-step Forge wizard flips its `type` from
// "button" to "submit" on the final step. Because the very click that advances
// the wizard mutates that same button node to type="submit" before the browser
// evaluates the click's default action, simply ARRIVING at the final step
// submits the form — here that means the vendor is registered before
// "Complete Registration" is ever pressed.
//
// VendorOnboardingPage cannot be driven to step 3 in jsdom (Radix selects and
// the file uploader), so this asserts the SOURCE invariant that actually
// prevents the bug instead of pretending to reproduce it: the wizard must never
// hand the browser a submit-typed control whose activation it does not own, and
// must instead drive submission explicitly via forge.handleSubmit(onSubmit).
//
// See src/pages/EvaluationManagementPage/__tests__/create-evaluation-no-premature-submit.test.tsx
// for the sibling guard.

describe("VendorOnboardingPage — no premature submit", () => {
  it("never renders a submit-typed button in its wizard footer", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      "src/pages/OnboardingPage/VendorOnboardingPage.tsx",
      "utf8",
    );

    // No control may be (conditionally) typed "submit" — that is what lets the
    // browser fire the form on arrival at the final step.
    expect(source).not.toMatch(/type=\{[^}]*"submit"/);
    expect(source).not.toMatch(/type="submit"/);

    // Submission must be driven explicitly by the click on the final step.
    expect(source).toContain("forge.handleSubmit(onSubmit)");
  });
});
