import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { PageLoader } from "@/components/ui/PageLoader";


// API Types based on Swagger documentation
type EvaluatorEvaluationGroup = {
  _id: string;
  name: string;
  email: string;
  uploadCount: number;
  action: string;
  pricing: number;
  vendorId: string
};

type EvaluatorEvaluationDetail = {
  _id: string;
  name: string;
  solId: string;
  typeId: { _id: string, name: string };
  status: string;
};

type EvaluationGroupResponse = {
  vendors: EvaluatorEvaluationGroup[];
  groupName: string;
  info: {
    solicitation: EvaluatorEvaluationDetail
    _id: string;
    status: string;
  };
};

// Component Vendor type
type Vendor = {
  id: string;
  vendorName: string;
  email: string;
  submittedDocument: number;
  pricing: number;
  action: string;
};

// API Hook for getting vendors in evaluation group
const useEvaluationGroupVendors = (evaluationId: string, evaluationGroupId: string) => {
  return useQuery<ApiResponse<EvaluationGroupResponse>, ApiResponseError>({
    queryKey: ["evaluation-group-vendors", evaluationId, evaluationGroupId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/evaluator/${evaluationId}/evaluation-group/${evaluationGroupId}`,
      });
      return response;
    },
    enabled: !!evaluationId && !!evaluationGroupId,
  });
};

const AssignedEvaluationDetailPage: React.FC = () => {
  const { id, groupId } = useParams<{ id: string; groupId: string }>();
  const navigate = useNavigate();
  
  // API call to get vendors in evaluation group
  const { data: evaluationGroupData, isLoading, error } = useEvaluationGroupVendors(
    id || "",
    groupId || ""
  );

  // Transform API data to component format
  const vendorsData = useMemo(() => {
    if (!evaluationGroupData?.data?.data) return [];
    
    return evaluationGroupData.data?.data?.vendors?.map((vendor: EvaluatorEvaluationGroup): Vendor => ({
      id: vendor?.vendorId,
      vendorName: vendor.name,
      email: vendor.email,
      submittedDocument: vendor.uploadCount,
      pricing: vendor.pricing,
      action: "View",
    }));
  }, [evaluationGroupData]);

  // Get evaluation info
  const evaluationInfo = evaluationGroupData?.data?.data?.info?.solicitation;
  const evaluationGroupName = evaluationGroupData?.data?.data?.groupName;

  // Define vendors table columns
  const vendorsColumns: ColumnDef<Vendor>[] = [
    {
      accessorKey: "vendorName",
      header: "Vendor Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.vendorName}
          </span>
          <a
            href={`mailto:${row.original.email}`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "submittedDocument",
      header: "Submitted Document",
      cell: ({ row }) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.original.submittedDocument}
        </span>
      ),
    },
    {
      accessorKey: "pricing",
      header: "Pricing",
      cell: ({ row }) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.original.pricing}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isViewAction = row.original.action === "View";
        return (
          <Button
            variant="ghost"
            size="sm"
            className={`font-medium ${
              isViewAction
                ? "text-green-600 hover:text-green-800"
                : "text-blue-600 hover:text-blue-800"
            }`}
            onClick={() => {
              if (isViewAction) {
                // Navigate to the submitted document page
                navigate(`/dashboard/evaluation/submitted-documents/${id}/${groupId}/${row.original.id}`);
              } else {
                // Handle evaluate action
                console.log("Evaluate vendor:", row.original.id);
              }
            }}
          >
            {row.original.action}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6 min-h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <span>Evaluations</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          Assigned Evaluation
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
            {evaluationInfo?.name || "Loading..."}
          </h1>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700"
        >
          {evaluationInfo?.status || "Active"}
        </Badge>
      </div>

      {/* Evaluation ID and Type */}
      <div className="flex items-center gap-6 mb-8">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{evaluationInfo?.solId || ""}</span> • {evaluationInfo?.typeId?.name || "RFP"}
        </div>
      </div>

      {/* Technical Group Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {evaluationGroupName}
        </h2>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Vendors
            </h3>
          </div>
          <div className="p-6">
            {isLoading ? (
              <PageLoader 
                showHeader={false}
                message="Loading vendors..."
                className="py-8"
              />
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">Error loading vendors: {error.message}</div>
              </div>
            ) : (
              <DataTable columns={vendorsColumns} data={vendorsData || []} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignedEvaluationDetailPage;
