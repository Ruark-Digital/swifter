export type EvaluationSubmissionCriteria = {
  criteria?: {
    pass_fail?: string;
  };
  scoring?: {
    comment?: string | null;
    scoring?: {
      pass_fail?: string | null;
      weight?: number | null;
    };
  };
};

const hasRequiredScore = (criteria: EvaluationSubmissionCriteria) => {
  const isPassFail = Boolean(criteria.criteria?.pass_fail);
  if (isPassFail) {
    return ["pass", "fail"].includes(
      (criteria.scoring?.scoring?.pass_fail ?? "").toLowerCase(),
    );
  }

  const weight = criteria.scoring?.scoring?.weight;
  return typeof weight === "number" && Number.isFinite(weight) && weight > 0;
};

const hasRequiredComment = (criteria: EvaluationSubmissionCriteria) =>
  Boolean(criteria.scoring?.comment?.trim());

export const getIncompleteEvaluationCriteriaCount = (
  criteria: EvaluationSubmissionCriteria[],
) =>
  criteria.filter(
    (criteriaItem) =>
      !criteriaItem.scoring ||
      !hasRequiredScore(criteriaItem) ||
      !hasRequiredComment(criteriaItem),
  ).length;

export const canSubmitEvaluationCriteria = (
  criteria: EvaluationSubmissionCriteria[],
) => criteria.length > 0 && getIncompleteEvaluationCriteriaCount(criteria) === 0;
