import { describe, expect, test } from "vitest";

import {
  canSubmitEvaluationCriteria,
  getIncompleteEvaluationCriteriaCount,
} from "../utils/evaluationSubmission";

describe("evaluation submission requirements", () => {
  test("requires both pass/fail score and comment", () => {
    const criteria = [
      {
        criteria: { pass_fail: "required" },
        scoring: {
          comment: "Looks good",
          scoring: { pass_fail: "pass", weight: 0 },
        },
      },
      {
        criteria: { pass_fail: "required" },
        scoring: {
          comment: "   ",
          scoring: { pass_fail: "fail", weight: 0 },
        },
      },
    ];

    expect(getIncompleteEvaluationCriteriaCount(criteria)).toBe(1);
    expect(canSubmitEvaluationCriteria(criteria)).toBe(false);
  });

  test("requires both weighted score and comment", () => {
    const criteria = [
      {
        criteria: { pass_fail: "" },
        scoring: {
          comment: "Meets expectations",
          scoring: { weight: 70 },
        },
      },
      {
        criteria: { pass_fail: "" },
        scoring: {
          comment: "Missing score",
          scoring: { weight: 0 },
        },
      },
    ];

    expect(getIncompleteEvaluationCriteriaCount(criteria)).toBe(1);
    expect(canSubmitEvaluationCriteria(criteria)).toBe(false);
  });

  test("allows submission only when every criterion has saved score and comment", () => {
    const criteria = [
      {
        criteria: { pass_fail: "required" },
        scoring: {
          comment: "Passes requirement",
          scoring: { pass_fail: "pass", weight: 0 },
        },
      },
      {
        criteria: { pass_fail: "" },
        scoring: {
          comment: "Strong response",
          scoring: { weight: 90 },
        },
      },
    ];

    expect(getIncompleteEvaluationCriteriaCount(criteria)).toBe(0);
    expect(canSubmitEvaluationCriteria(criteria)).toBe(true);
  });
});
