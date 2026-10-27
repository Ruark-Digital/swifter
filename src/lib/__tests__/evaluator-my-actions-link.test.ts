import { describe, expect, it } from "vitest";
import { DashboardDataTransformer } from "@/lib/dashboardDataTransformer";

// #92 — the evaluator scoring reminder must deep-link to the ASSIGNED
// evaluation route (which needs both the evaluation id and the group id), not
// the generic /dashboard/evaluation/{id} PL view, which returns an error page.
describe("transformEvaluatorMyActions link (QA #92)", () => {
  const build = (statusText: string, evaGroupId: string | null) =>
    DashboardDataTransformer.transformEvaluatorMyActions([
      {
        statusText,
        type: "score",
        createdAt: "2026-09-25T10:00:00.000Z",
        evaluation: {
          _id: "eva1",
          solicitation: { _id: "sol1", name: "Refinery Evaluation", timezone: "EST" },
        },
        evaluationGroup: evaGroupId ? { _id: evaGroupId } : undefined,
      },
    ] as any)[0];

  it("routes a matched 'Scored' reminder to the assigned route", () => {
    const item = build("Refinery Evaluation has been Scored", "grp1");
    expect(item.text).toContain(
      'href="/dashboard/evaluation/assigned/eva1/grp1"',
    );
    expect(item.text).not.toContain('href="/dashboard/evaluation/eva1"');
  });

  it("routes an unmatched scoring reminder to the assigned route too", () => {
    const item = build(
      "Refinery Evaluation has been released for evaluation, please proceed with scoring",
      "grp1",
    );
    expect(item.text).toContain(
      'href="/dashboard/evaluation/assigned/eva1/grp1"',
    );
  });

  it("falls back to the evaluation list when the group id is missing", () => {
    const item = build("Refinery Evaluation has been Scored", null);
    expect(item.text).toContain(
      'href="/dashboard/evaluation" class',
    );
    expect(item.text).not.toContain("/assigned/eva1/");
  });
});
