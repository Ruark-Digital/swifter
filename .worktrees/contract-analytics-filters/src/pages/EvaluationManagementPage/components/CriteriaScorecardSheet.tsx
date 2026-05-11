import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ApiResponseError } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ScoreCardItem {
  scoring?:  number | "pass" | "fail";
  _id: string;
  evaluationCriteria: {
    criteria: {
      pass_fail: string;
      weight: number;
      status: string;
    };
    _id: string;
    evaluation: string;
  };
  vendor: { _id: string; name: string };
  evaluator: { _id: string; name: string };
  comment?: string;
  evaluation: string;
}

interface CriteriaScorecardResponse {
  status: number;
  message: string;
  data: ScoreCardItem[];
}

export const CriteriaScorecardSheet = ({
  evaluationId,
  criteriaId,
}: {
  evaluationId: string;
  criteriaId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: scoreData,
    isLoading,
    error,
  } = useQuery<CriteriaScorecardResponse, ApiResponseError>({
    queryKey: ["criteria-score-card", evaluationId, criteriaId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}/criteria/${criteriaId}/score-card`,
      });
      return response.data as CriteriaScorecardResponse;
    },
    enabled: isOpen && !!evaluationId && !!criteriaId,
  });

  const rows: ScoreCardItem[] = Array.isArray(scoreData?.data)
    ? scoreData!.data.sort((a, b) => {
        const aEvaluator = a.evaluator.name ?? "";
        const bEvaluator = b.evaluator.name ?? "";
        return bEvaluator.localeCompare(aEvaluator);
      })
    : [];

  const vendorGroups = (() => {
    const map = new Map<
      string,
      { vendorName: string; items: ScoreCardItem[] }
    >();
    rows.forEach((item, idx) => {
      const key = item.vendor?._id || item.vendor?.name || String(idx);
      const name = item.vendor?.name || "";
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(key, { vendorName: name, items: [item] });
      }
    });
    return Array.from(map.entries());
  })();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="link" className="text-green-600 p-0 h-auto">
          View Scores
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl p-0 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-slate-200" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-slate-200">
              Criteria Score Card
            </h2>
          </div>
        </div>

        <div className="py-6">
          {error && (
            <div className="text-red-600 dark:text-red-400 mb-3">
              {error?.response?.data?.message || "Failed to load score card"}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Loading scores...</span>
            </div>
          ) : vendorGroups.length === 0 ? (
            <div className="px-6 text-sm text-gray-500 dark:text-gray-400">No scores available.</div>
          ) : (
            <div className="px-6">
              <Accordion type="single" collapsible>
                {vendorGroups.map(([vendorId, group], gIdx) => (
                  <AccordionItem
                    key={vendorId || gIdx}
                    value={`vendor-${vendorId || gIdx}`}
                  >
                    <AccordionTrigger>
                      <span className="font-medium text-gray-900 dark:text-slate-200">
                        {group.vendorName}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {group.items.map((item, idx) => {
                        const status =
                          item.evaluationCriteria?.criteria?.status;
                        const isPassFail = status === "pass_fail";
                        const passFailVal = item.scoring;
                        const passLabel =
                          String(passFailVal || "").toLowerCase() === "fail"
                            ? "Fail"
                            : "Pass";
                        const scoreVal = item.scoring ?? "-";
                        const weightConfigured =
                          item.evaluationCriteria?.criteria?.weight ?? "-";
                        return (
                          <div key={idx} className="border rounded-lg mb-4">
                            <div className="flex items-center justify-between p-4">
                              <span className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                {item.evaluator?.name}
                              </span>
                            </div>
                            <div className="px-4 pb-4 border-t">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Score
                                  </p>
                                  {isPassFail ? (
                                    <Badge
                                      className={
                                        passLabel === "Pass"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                      }
                                    >
                                      {passLabel}
                                    </Badge>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                      {scoreVal}
                                    </p>
                                  )}
                                </div>
                                {!isPassFail && (
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                      Weight
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                      {weightConfigured}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {item.comment && (
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    Comments
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {item.comment}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CriteriaScorecardSheet;
