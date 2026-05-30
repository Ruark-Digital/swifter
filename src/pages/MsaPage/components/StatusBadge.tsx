import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status =
  | "draft"
  | "publish"
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "terminated"
  | "pending_approval"
  | "submitted"
  | "approved"
  | "rejected";

const getStatus = (status?: Status) => {
  if (status === "active")
    return { label: "Active", className: "bg-green-100 text-green-700" };
  if (status === "publish")
    return { label: "Published", className: "bg-green-100 text-green-700" };
  if (status === "draft")
    return { label: "Draft", className: "bg-slate-100 text-slate-700" };
  if (status === "pending_approval")
    return {
      label: "Pending Approval",
      className: "bg-yellow-100 text-yellow-700",
    };
  if (status === "completed")
    return { label: "Completed", className: "bg-blue-100 text-blue-700" };
  if (status === "cancelled")
    return { label: "Cancelled", className: "bg-red-100 text-red-700" };
  if (status === "expired")
    return { label: "Expired", className: "bg-orange-100 text-orange-700" };
  if (status === "terminated")
    return { label: "Terminated", className: "bg-red-100 text-red-700" };
  if (status === "pending")
    return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
  if (status === "submitted")
    return { label: "Submitted", className: "bg-blue-100 text-blue-700" };
  if (status === "approved")
    return { label: "Approved", className: "bg-green-100 text-green-700" };
  if (status === "rejected")
    return { label: "Rejected", className: "bg-red-100 text-red-700" };
  return { label: "Unknown", className: "bg-slate-100 text-slate-700" };
};

export const StatusBadge = ({ status }: { status?: Status | undefined }) => {
  const statusObj = getStatus(status);
  return (
    <Badge className={cn("px-2 py-1 w-fit", statusObj?.className)}>
      {statusObj?.label}
    </Badge>
  );
};
