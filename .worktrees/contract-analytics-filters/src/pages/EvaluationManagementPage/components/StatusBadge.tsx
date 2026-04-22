import { Badge } from "@/components/ui/badge";
import { getEvaluationStatusLabel, getEvaluationStatusColorClass } from "@/lib/evaluationStatusUtils";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <Badge className={`${getEvaluationStatusColorClass(status)} border-0`}>
      {getEvaluationStatusLabel(status)}
    </Badge>
  );
};