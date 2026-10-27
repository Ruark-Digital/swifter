import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";

// Reported: the create solicitation wizard "auto submit once the user gets to
// the publish step instead of when the user clicks on the buttons (publish or
// save as draft)".
//
// Cause (same family as the evaluation wizards, commits 6548510d8 / 6660e6ab9):
// the primary footer button flipped `type` from "button" to "submit" as soon
// as currentStep became 6. A submit-typed button lets the browser decide when
// the form fires, so merely ARRIVING at step 6 could publish the solicitation.
//
// Neither wizard can be driven to step 6 under jsdom (Radix selects + date
// pickers), so this asserts the property that actually prevents the bug: the
// dialog must never hand the browser a submit-typed control whose activation it
// does not initiate, and must instead drive submission explicitly from the
// click via forge.handleSubmit(onSubmit).
describe("solicitation wizards — no premature submit", () => {
  it.each([
    "CreateSolicitationDialog",
    "EditSolicitationDialog",
  ])("%s never renders a submit-typed button in its footer", async (name) => {
    const source = await fs.readFile(
      `src/pages/SolicitationManagementPage/components/${name}.tsx`,
      "utf8",
    );

    expect(source).not.toMatch(/type=\{[^}]*"submit"/);
    expect(source).toContain("forge.handleSubmit(onSubmit)");
  });
});
