import React, { useMemo } from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Search, } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractComplianceDTO
  // contractManagerApi, 
  // ApprovalActionDTO 
} from "../api/contractManagerApi";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
// import { useToast } from "@/components/ui/use-toast";
import { differenceInDays } from "date-fns";

export type PolicyRow = {
  id: string;
  policyId: string;
  policyName: string;
  limit: string;
  status: string;
};

export type SecurityRow = {
  id: string;
  securityId: string;
  securityType: string;
  amount: string;
  dueDate: string;
  dueIn: string;
  status: string;
};

interface ComplianceSecurityTabProps {
  isLoading?: boolean;
  data?: ContractComplianceDTO;
}

const ComplianceSecurityTab: React.FC<ComplianceSecurityTabProps> = ({ isLoading, data }) => {
  const [search, setSearch] = React.useState("");
  const [activeView, setActiveView] = React.useState<"policy" | "security">("policy");
  // const { id: contractId } = useParams<{ id: string }>();
  // const queryClient = useQueryClient();
  const { isManager } = useUserRole();
  // const { toast } = useToast();

  const formatMoneyNoSymbol = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  // const { mutate: approveItem, isPending: isApproving } = useMutation({
  //   mutationFn: async ({
  //     type,
  //     typeId,
  //     payload,
  //   }: {
  //     type: "policy" | "security";
  //     typeId: string;
  //     payload: ApprovalActionDTO;
  //   }) => {
  //     if (!contractId) return;
  //     return await contractManagerApi.approveComplianceItem(
  //       contractId,
  //       type,
  //       typeId,
  //       payload
  //     );
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["contract-compliance", contractId] });
  //     toast({
  //       title: "Success",
  //       description: "Compliance item updated successfully",
  //     });
  //   },
  //   onError: () => {
  //     // error toast handled by toaster hook or global handler if desired
  //   },
  // });

  // const handleApprove = (type: "policy" | "security", id: string) => {
  //   approveItem({ type, typeId: id, payload: { action: "approved" } });
  // };

  // const handleReject = (type: "policy" | "security", id: string) => {
  //   // For now, rejecting without comment. 
  //   // In a real scenario, we might want to prompt for a comment.
  //   approveItem({ type, typeId: id, payload: { action: "rejected" } });
  // };

  const columns = useMemo<ColumnDef<PolicyRow>[]>(() => [
    { accessorKey: "policyId", header: "Policy ID" },
    { 
      accessorKey: "policyName", 
      header: "Policy Name",
      cell: ({ getValue }) => <span className="text-slate-700">{getValue<string>()}</span>,
    },
    { 
      accessorKey: "limit", 
      header: "Limit",
      cell: ({ getValue }) => <span className="font-semibold">{getValue<string>()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue<string>();
        let tone = "bg-gray-100 text-gray-700";
        if (s?.toLowerCase() === "approved" || s?.toLowerCase() === "submitted") tone = "bg-green-100 text-green-700";
        if (s?.toLowerCase() === "pending") tone = "bg-yellow-100 text-yellow-700";
        if (s?.toLowerCase() === "rejected") tone = "bg-red-100 text-red-700";
        
        return <Badge variant="secondary" className={`font-medium ${tone}`}>{s}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => {
        // const status = row.original.status?.toLowerCase();
        // const showActions = isManager && (status === "pending" || status === "pending submission");
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="link" className="text-green-600 font-semibold p-0 h-auto">
              View
            </Button>
            {/* {showActions && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove("policy", row.original.id)}
                  disabled={isApproving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject("policy", row.original.id)}
                  disabled={isApproving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )} */}
          </div>
        );
      },
    },
  ], [isManager, 
    // isApproving
  ]);

  const securityColumns = useMemo<ColumnDef<SecurityRow>[]>(() => [
    { accessorKey: "securityId", header: "Security ID" },
    { 
      accessorKey: "securityType", 
      header: "Security Type",
      cell: ({ getValue }) => <span className="text-slate-700">{getValue<string>()}</span>,
    },
    { 
      accessorKey: "amount", 
      header: "Amount",
      cell: ({ getValue }) => <span className="font-semibold">{getValue<string>()}</span>,
    },
    {
      accessorKey: "dueDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <div>
            <span className="text-slate-500 mr-1">Due Date:</span>
            <span className="font-medium text-slate-900">{row.original.dueDate}</span>
          </div>
          {row.original.dueIn && row.original.dueIn !== "-" && (
            <div>
              <span className="text-slate-500 mr-1">Due in:</span>
              <span className="text-slate-900">{row.original.dueIn}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue<string>();
        let tone = "bg-gray-100 text-gray-700";
        if (s?.toLowerCase() === "approved" || s?.toLowerCase() === "submitted") tone = "bg-green-100 text-green-700";
        if (s?.toLowerCase() === "pending") tone = "bg-yellow-100 text-yellow-700";
        if (s?.toLowerCase() === "rejected") tone = "bg-red-100 text-red-700";
        return <Badge variant="secondary" className={`font-medium ${tone}`}>{s}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: () => {
      //    const status = row.original.status?.toLowerCase();
      //  const showActions = isManager && (status === "pending" || status === "pending submission");
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="link" className="text-green-600 font-semibold p-0 h-auto">
              View
            </Button>
            {/* {showActions && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove("security", row.original.id)}
                  disabled={isApproving}
                  aria-label="Approve security"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject("security", row.original.id)}
                  disabled={isApproving}
                  aria-label="Reject security"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )} */}
          </div>
        );
      },
    },
  ], [isManager]);

  const policyRows: PolicyRow[] = useMemo(() => {
    if (!data?.policy) return [];
    return data.policy.map(p => ({
      id: p.id || "",
      policyId: p.policyId || p.id || "-",
      policyName: p.policyName || "-",
      limit: formatMoneyNoSymbol(p.value),
      status: p.status || "Pending",
    }));
  }, [data?.policy]);

  const securityRows: SecurityRow[] = useMemo(() => {
    if (!data?.security) return [];
    return data.security.map(s => {
      const dueDate = s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : "-";
      let dueIn = "-";
      if (s.expiryDate) {
        const days = differenceInDays(new Date(s.expiryDate), new Date());
        if (days > 0) dueIn = `${days} days`;
        else if (days === 0) dueIn = "Today";
        else dueIn = "Overdue";
      }

      return {
        id: s.id || "",
        securityId: s.id || "-", // Using id as securityId if not provided
        securityType: s.securityType || "-",
        amount: formatMoneyNoSymbol(s.amount),
        dueDate,
        dueIn,
        status: s.status || "Pending",
      };
    });
  }, [data?.security]);

  const filteredPolicyRows = useMemo(() => {
    if (!search) return policyRows;
    return policyRows.filter(row => 
      row.policyName.toLowerCase().includes(search.toLowerCase()) ||
      row.policyId.toLowerCase().includes(search.toLowerCase())
    );
  }, [policyRows, search]);

  const filteredSecurityRows = useMemo(() => {
    if (!search) return securityRows;
    return securityRows.filter(row => 
      row.securityType.toLowerCase().includes(search.toLowerCase()) ||
      row.securityId.toLowerCase().includes(search.toLowerCase())
    );
  }, [securityRows, search]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Compliance & Security Details</h3>
        <Button variant="outline" className="text-slate-600 border-slate-300">
          <Share2 className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Insurance Coverage</p>
            <p className="text-base font-semibold text-slate-900">
              {data?.details?.coverage ? `${data.details.coverage} Coverages` : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Contract Security</p>
            <p className="text-base font-semibold text-slate-900">
              {data?.details?.security ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Insurance Expiry Date</p>
            <p className="text-base font-semibold text-slate-900">
              {data?.details?.expDate ? new Date(data.details.expDate).toLocaleDateString() : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Security Type</p>
            <p className="text-base font-semibold text-slate-900">
              {data?.details?.securityType?.map((t) => t.name).join(", ") || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle and Table Section */}
      <div className="space-y-6">
        {/* Custom Toggle */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-full inline-flex">
            <button
              onClick={() => setActiveView("policy")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeView === "policy"
                  ? "bg-[#1E293B] text-white"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Insurance Coverage
            </button>
            <button
              onClick={() => setActiveView("security")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeView === "security"
                  ? "bg-[#1E293B] text-white"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Contract Security
            </button>
          </div>
        </div>

        {/* Search and Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="font-medium text-slate-700 w-20">
              {activeView === "policy" ? "Policy" : "Security"}
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9 bg-white" 
              />
            </div>
          </div>

          <div className="border rounded-md bg-white">
            {activeView === "policy" ? (
              <DataTable<PolicyRow> 
                data={filteredPolicyRows} 
                columns={columns} 
                options={{ disableSelection: true, disablePagination: true }} 
              />
            ) : (
              <DataTable<SecurityRow> 
                data={filteredSecurityRows} 
                columns={securityColumns} 
                options={{ disableSelection: true, disablePagination: true }} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSecurityTab;
