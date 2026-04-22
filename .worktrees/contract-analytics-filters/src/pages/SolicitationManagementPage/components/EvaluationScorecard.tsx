import React from "react";
// import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useEvaluationScorecard,
  EvaluationCriteria,
} from "../hooks/useEvaluationScorecard";
import { formatDateTZ } from "@/lib/utils";

interface EvaluationScorecardProps {
  solicitationId: string;
  evaluatorId: string;
  evaluatorData?: {
    name: string;
    email: string;
    submissionDate: string;
    status: string;
    evaluationScore: number;
  };
  timezone?: string;
}

const EvaluationScorecard: React.FC<EvaluationScorecardProps> = ({
  solicitationId,
  evaluatorId,
  timezone,
}) => {
  const {
    data: scorecardData,
    isLoading,
    error,
  } = useEvaluationScorecard(solicitationId, evaluatorId);

  // Use API data if available, otherwise fallback to prop data
  const displayData = scorecardData?.data?.evaluator;
  const criteriaData = (
    (scorecardData?.data?.criteria || []) as EvaluationCriteria[]
  )
    .slice()
    .sort((a: EvaluationCriteria, b: EvaluationCriteria) => {
      const aName = a.vendorName?.toLowerCase() || "\uffff";
      const bName = b.vendorName?.toLowerCase() || "\uffff";
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return 0;
    });
  const totalCriteriaScore = scorecardData?.data?.criteriaWeightSummtion || 0;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-slate-200">
            Loading evaluation scorecard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-slate-200 mb-2">
            Failed to load evaluation scorecard
          </p>
          <p className="text-gray-500 dark:text-slate-200 text-sm">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-slate-200">
          No evaluation data available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full ">
      {/* Header */}
      <div className="flex items-center gap-3 p-6">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M9 18L15 12L9 6"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
          Evaluation Scorecard
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
        {/* Evaluator Details Section */}
        <div className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
              Evaluator Details
            </h3>
            {/* <Button
              variant="outline"
              className="flex items-center gap-2 text-gray-600 dark:text-slate-200 border-gray-300 rounded-xl px-4 py-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </Button> */}
          </div>

          <div className="space-y-4">
            {/* Row 1 */}
            <div className="flex justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-slate-200 mb-1">
                  Evaluator Name
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                  {displayData.name}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-slate-200 mb-1">
                  Contact
                </p>
                <p className="text-sm text-blue-600 dark:text-slate-200">
                  {displayData.email}
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-slate-200 mb-1">
                  Submission Date
                </p>
                <p className="text-sm font-medium dark:text-slate-200 text-gray-900">
                  {displayData?.submission
                    ? formatDateTZ(
                        displayData?.submission,
                        "MMM d, yyyy hh:mm a",
                        timezone
                      )
                    : "N/A"}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-slate-200 mb-1">
                  Status
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-xl bg-green-100">
                  <span className="text-sm font-medium text-green-700">
                    {displayData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            {/* <div className="flex justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-slate-200 mb-1">Evaluation Score</p>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                  {displayData.score}%
                </p>
              </div>
            </div> */}
          </div>
        </div>

        {/* Evaluation Criterion Breakdown Section */}
        <div className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">
              Evaluation Criterion Breakdown
            </h3>
          </div>

          {(() => {
            // Group criteria by vendor name
            const vendorGroups = criteriaData.reduce(
              (
                groups: Record<
                  string,
                  {
                    vendorName: string;
                    criteria: EvaluationCriteria[];
                    totalVendorScore?: number;
                  }
                >,
                item: EvaluationCriteria
              ) => {
                const key = item.vendorName || "N/A";
                if (!groups[key]) {
                  groups[key] = {
                    vendorName: key,
                    criteria: [],
                    totalVendorScore: item.totalVendorScore,
                  };
                }
                groups[key].criteria.push(item);
                if (typeof item.totalVendorScore === "number") {
                  groups[key].totalVendorScore = item.totalVendorScore || item.newScore.score;
                }
                return groups;
              },
              {}
            );
            const groupedVendors = Object.values(vendorGroups);

            return (
              <Accordion type="multiple" className="w-full">
                {groupedVendors.length > 0 ? (
                  groupedVendors.map((group, idx) => (
                    <AccordionItem
                      key={group.vendorName || idx}
                      value={group.vendorName || `vendor-${idx}`}
                      className={
                        idx === groupedVendors.length - 1
                          ? "border-b border-gray-200 dark:border-gray-700"
                          : "border-none"
                      }
                    >
                      <AccordionTrigger className="text-left">
                        <div className="flex justify-between items-center w-full pr-4">
                          <div className="flex flex-col max-w-sm">
                            <span className="font-medium dark:text-slate-200">
                              {group.vendorName || "N/A"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-slate-200">
                              Criteria: {group.criteria.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium dark:text-slate-200 capitalize">
                              Evaluator Score:{" "}
                              {(() => {
                                const v = (group as any).totalVendorScore;
                                if (typeof v === "string" && v.trim()) {
                                  return v;
                                }
                                const total =
                                  typeof v === "number"
                                    ? v
                                    : group.criteria.reduce(
                                        (acc, c) =>
                                          acc +
                                          (typeof c.newScore?.score === "number"
                                            ? c.newScore.score
                                            : 0),
                                        0
                                      );
                                return `${Number(total).toFixed(0)}/${totalCriteriaScore}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 space-y-3">
                          {group.criteria.map((criteria, cIdx) => (
                            <div
                              key={criteria.id || cIdx}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between px-2">
                                <p className="text-sm font-medium dark:text-slate-200">
                                  {criteria.title}
                                </p>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium dark:text-slate-200">
                                    Weight: {criteria.newScore.weight}
                                  </span>
                                  <span className="text-sm font-medium dark:text-slate-200">
                                    Score: {criteria.newScore.score}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-slate-200 max-w-lg">
                                {criteria.description}
                              </p>
                              {criteria.comment && (
                                <div className="bg-gray-50 p-3 rounded-lg dark:bg-slate-700">
                                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                                    Comments:
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-slate-200">
                                    {criteria.comment}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <></>
                )}
              </Accordion>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default EvaluationScorecard;
