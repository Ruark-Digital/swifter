import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaymentSummaryMilestonesTable from "../components/PaymentSummaryMilestonesTable";
import type { ColumnDef } from "@tanstack/react-table";
import ReleaseHoldbackDialog from "../components/ReleaseHoldbackDialog";
import HoldbackDetailsSheet from "../components/HoldbackDetailsSheet";
import SavingsDetailsSheet from "../components/SavingsDetailsSheet";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextCurrencyInput,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { Check, CloudUpload, FileText, X } from "lucide-react";
import type { ContractDetail } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { contractManagerApi } from "../api/contractManagerApi";
import { formatDateTZ } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useWatch } from "react-hook-form";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import  Spinner  from "@/components/ui/Spinner";

type HoldbackReleaseRow = {
  releaseId: string;
  releasedType: string;
  releasedAmount: string;
  status: string;
  dueDate: string;
};

type SavingsRealizedRow = {
  savingsId: string;
  savingsTitle: string;
  category: string;
  amount: string;
  dateSubmitted: string;
};

const holdbackReleaseColumns: ColumnDef<HoldbackReleaseRow>[] = [
  {
    accessorKey: "releaseId",
    header: "Release ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedType",
    header: "Released Type",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedAmount",
    header: () => <div className="w-[140px] text-center">Released Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="w-[120px] text-center">Status</div>,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const normalized = value?.toLowerCase();
      const styles =
        normalized === "approved"
          ? "bg-[#EAF7EE] text-[#16A34A]"
          : normalized === "pending"
            ? "bg-[#FEF9C3] text-[#CA8A04]"
            : "bg-[#F3F4F6] text-[#6B7280]";
      const label = value || "-";
      return (
        <div className="flex w-[120px] justify-center py-4">
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold ${styles}`}
          >
            {label}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: () => <div className="w-[120px] text-center">Due Date</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="w-[80px] text-center">Action</div>,
    cell: ({ row }) => (
      // <div className="flex justify-center py-4">
      <HoldbackDetailsSheet
        holdBackId={row.getValue<string>("releaseId")}
          currency={row.getValue<string>("currency")}
        trigger={
          <button
            type="button"
            className="text-sm font-semibold text-[#16A34A] underline underline-offset-2"
          >
            View
          </button>
        }
      />
      // </div>
    ),
  },
];

const savingsRealizedColumns: ColumnDef<SavingsRealizedRow>[] = [
  {
    accessorKey: "savingsId",
    header: "Savings ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "savingsTitle",
    header: "Savings Title",
    cell: ({ getValue }) => (
      <div className="w-[220px] py-4 text-sm font-medium leading-5 text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <div className="w-[190px] py-4 text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="w-[120px] text-center">Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-semibold text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "dateSubmitted",
    header: () => <div className="w-[140px] text-center">Date Submitted</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-medium text-[#374151]">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="w-[80px] text-center">Action</div>,
    cell: ({ row }) => (
      <div className="flex w-[80px] justify-center py-4">
        <SavingsDetailsSheet
          savingId={row.getValue<string>("savingsId")}
          currency={row.getValue<string>("currency")}
          trigger={
            <button
              type="button"
              className="text-sm font-semibold text-[#16A34A] underline underline-offset-2"
            >
              View
            </button>
          }
        />
      </div>
    ),
  },
];


type UpdateSavingsFormValues = {
  title: string;
  amount: string;
  category: string;
  description: string;
  files: File[] | null;
};

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  amount: yup.string().required("Amount is required"),
  category: yup.string().required("Category is required"),
  description: yup.string().optional(),
  files: yup.mixed().nullable(),
});

const UploadElement = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <CloudUpload className="h-12 w-12 text-[#2A4467]" />
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </p>
        <p className="text-sm text-[#6B7280]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
};

const UpdateSavingsDialog: React.FC<{
  trigger: React.ReactElement;
  contractId: string;
}> = ({ trigger, contractId }) => {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { control, reset, setValue } = useForge<UpdateSavingsFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      title: "",
      amount: "",
      category: "",
      description: "",
      files: null,
    },
  });

  const value = useWatch({ control, name: "files" }) as File[];

  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadSavingFile"],
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append("file", file);

      return await postRequest({
        url: "/upload",
        payload: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
    },
  });

  const createMutation = useMutation({
    mutationKey: ["createPaymentSaving", contractId],
    mutationFn: async (data: any) => {
      return await contractManagerApi.createPaymentSaving(contractId, data);
    },
    onSuccess: async () => {
      setOpen(false);
      setSuccessOpen(true);
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["contract-payment-savings", contractId],
      });
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to create saving",
      );
    },
  });

  const handleSubmit = async (data: UpdateSavingsFormValues) => {
    setIsSubmitting(true);
    try {
      let uploadedFiles: {
        name: string;
        url: string;
        type: string;
        size: number;
      }[] = [];

      if (data.files && data.files.length > 0) {
        const uploadPromises = data.files.map((file) => uploadFile({ file }));
        const responses = await Promise.all(uploadPromises);

        uploadedFiles = responses
          .map((res, index) => {
            if (res.data && res.data?.data?.[0]) {
              return {
                name: data.files![index].name,
                url: res.data?.data?.[0].url,
                type: getSimpleFileExtension(data.files![index].name).toUpperCase(),
                size: data.files![index].size,
              };
            }
            return null;
          })
          .filter(Boolean) as any;
      }

      const payload = {
        title: data.title,
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        files: uploadedFiles,
      };

      await createMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error submitting savings:", error);
      toastHandler.error("Submission Failed", "An error occurred while submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileListItem = ({ file }: { file: File }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">
              {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setValue(
              "files",
              (value || []).filter((v: File) => v.name !== file.name),
            )
          }
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setOpen(nextOpen);
            if (!nextOpen) reset();
          }
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-xl gap-0 overflow-hidden rounded-2xl border-0 p-0"
        >
          <Forge
            control={control}
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] flex-col"
          >
            <div className="flex items-center justify-between px-8 pb-2 pt-8">
              <div className="text-xl font-semibold text-[#0F0F0F]">
                Update Savings Realized
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setOpen(false)}
                disabled={isSubmitting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8 pt-6">
              <Forger
                name="title"
                label="Title"
                placeholder="Enter Title"
                component={TextInput}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Forger
                  name="amount"
                  label="Amount"
                  placeholder="Enter Amount"
                  component={TextCurrencyInput}
                />
                <Forger
                  name="category"
                  label="Category"
                  placeholder="Select Category"
                  component={TextSelect}
                  options={[
                    {
                      label: "Direct Negotiations",
                      value: "Direct Negotiations",
                    },
                    { label: "Indirect Savings", value: "Indirect Savings" },
                    { label: "Cost Avoidance", value: "Cost Avoidance" },
                    { label: "Value Engineering", value: "Value Engineering" },
                    {
                      label: "Working Capital Optimization",
                      value: "Working Capital Optimization",
                    },
                    {
                      label: "Total Cost Of Ownership Savings",
                      value: "Total Cost Of Ownership Savings",
                    },
                    {
                      label: "Spend Under Management Savings.",
                      value: "Spend Under Management Savings.",
                    },
                  ]}
                />
              </div>
              <Forger
                name="description"
                label="Description"
                placeholder="Enter Amount"
                component={TextArea}
                rows={5}
              />
              <div className="space-y-4">
                <div className="text-sm font-medium text-[#6B6B6B]">
                  Upload Files
                </div>
                <Forger
                  name="files"
                  component={TextFileUploader}
                  element={<UploadElement />}
                  List={FileListItem}
                  className="rounded-xl border border-dashed border-[#2A4467]"
                  accept={
                    {
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        [".docx"],
                      "application/vnd.ms-excel": [".xls"],
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                        [".xlsx"],
                      "application/zip": [".zip"],
                      "image/png": [".png"],
                      "image/jpeg": [".jpeg", ".jpg"],
                    } as any
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 px-8 pb-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-white" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </Forge>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl border-0 px-8 py-10"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F]">
              Savings Updated Successfully
            </div>
            <div className="flex w-full items-center gap-4">
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

type Props = {
  contractId: string;
  contract?: ContractDetail | null;
  isActive?: boolean;
};

const PaymentSummaryTabContent: React.FC<Props> = ({ 
  contractId,
  contract,
  isActive,
}) => {
  const { isVendor, isManager, isApprover } = useUserRole();

  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ holdbacks?: unknown; savings?: unknown }>(
    {},
  );
  const holdbacksQueryKey = useUserQueryKey([
    "contract-payment-holdbacks",
    contractId,
  ]);
  const savingsQueryKey = useUserQueryKey([
    "contract-payment-savings",
    contractId,
  ]);

  const {
    data: holdbacksResponse,
    error: holdbacksError,
    isLoading: holdbacksLoading,
  } = useQuery({
    queryKey: holdbacksQueryKey,
    queryFn: async () => {
      if (isManager) {
        return contractManagerApi.listPaymentHoldbacks(contractId);
      }
      if (isApprover) {
        const res = await getRequest({
          url: `/contract/approver/contracts/${contractId}/payment-holdbacks`,
        });
        return res.data as { message?: string; data?: any[] };
      }
      if (isVendor) {
        const res = await getRequest({
          url: `/contract/vendor/contracts/${contractId}/payment-holdbacks`,
        });
        return res.data as { message?: string; data?: any[] };
      }
      return { data: [] as any[] };
    },
    enabled:
      Boolean(contractId) && !!isActive && (isManager || isApprover || isVendor),
    staleTime: 60000,
    retry: false,
  });

  const {
    data: savingsResponse,
    error: savingsError,
    isLoading: savingsLoading,
  } = useQuery({
    queryKey: savingsQueryKey,
    queryFn: async () => {
      if (isManager) {
        return contractManagerApi.listPaymentSavings(contractId);
      }
      if (isApprover) {
        const res = await getRequest({
          url: `/contract/approver/contracts/${contractId}/payment-savings`,
        });
        return res.data as { message?: string; data?: any[] };
      }
      if (isVendor) {
        const res = await getRequest({
          url: `/contract/vendor/contracts/${contractId}/payment-savings`,
        });
        return res.data as { message?: string; data?: any[] };
      }
      return { data: [] as any[] };
    },
    enabled:
      Boolean(contractId) && !!isActive && (isManager || isApprover || isVendor),
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!holdbacksError) return;
    if (lastErrorRef.current.holdbacks === holdbacksError) return;
    lastErrorRef.current.holdbacks = holdbacksError;
    toastErrorRef.current("Payment Holdbacks", holdbacksError as any);
  }, [holdbacksError]);

  React.useEffect(() => {
    if (!savingsError) return;
    if (lastErrorRef.current.savings === savingsError) return;
    lastErrorRef.current.savings = savingsError;
    toastErrorRef.current("Payment Savings", savingsError as any);
  }, [savingsError]);

  const currency = contract?.currency || "USD";
  const formatMoney = React.useCallback(
    (value?: number) => {
      if (value == null || !Number.isFinite(value)) return "-";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${value}`;
      }
    },
    [currency],
  );

  const holdbackRows = React.useMemo<HoldbackReleaseRow[]>(() => {
    const holdbacks = holdbacksResponse?.data ?? [];
    
    return holdbacks.map((holdback) => ({
      releaseId: holdback.holdBackId ?? `-`,
      currency,
      releasedType:
        holdback.type === "full"
          ? "Full"
          : holdback.type === "partial"
            ? "Partial"
            : "-",
      releasedAmount: formatMoney(holdback.amount),
      status: holdback?.status ?? "-",
      dueDate: formatDateTZ(holdback?.releasedDate, "MMM d, yyyy") ?? "-",
    }));
  }, [formatMoney, holdbacksResponse?.data, currency]);

  const savingsRows = React.useMemo<SavingsRealizedRow[]>(() => {
    const savings = savingsResponse?.data ?? [];
    return savings.map((saving) => ({
      savingsId: saving.savingId ?? `-`,
      savingsTitle: saving.title ?? "-",
      category: saving.category ?? "-",
      amount: formatMoney(saving.amount),
      currency,
      dateSubmitted: formatDateTZ(saving?.submittedDate, "MMMM d, yyyy") ?? "-",
    }));
  }, [formatMoney, savingsResponse?.data, currency]);

  const milestoneRows = React.useMemo(() => {
    const milestones = Array.isArray(contract?.milestone)
      ? contract?.milestone
      : [];
    return milestones.map((milestone: any, index: number) => {
      const dueDate = milestone?.dueDate
        ? formatDateTZ(milestone?.dueDate, "MMM d, yyyy")
        : "-";
      return {
        milestoneId: milestone?.milestoneId ?? `milestone-${index + 1}`,
        milestoneTitle: milestone?.name ?? "-",
        deliverable: milestone?.deliverable?.name ?? milestone?.name ?? "-",
        amount: formatMoney(milestone?.amount),
        dueDate,
      };
    });
  }, [contract?.milestone, formatMoney]);

  const contractValue = formatMoney(contract?.contractValue);
  const holdbackReleased = formatMoney(contract?.holdBackReleased);
  const savingAmount = formatMoney(contract?.savingAmount);
  const holdbackValue =
    contract?.holdBack != null ? String(contract?.holdBack) : "-";
  const holdbackAmount =
    contract?.holdBackBank != null ? formatMoney(contract?.holdBackBank) : "-";
  const contigency = formatMoney(Number(contract?.contigency)) ?? "-";
  const paymentStructure = contract?.paymentStructure ?? "-";
  const paymentTerm = contract?.paymentTerms?.name ?? "-";

  return (
    <TabsContent value="payment-summary" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F]">
          Payment Summary
        </h3>

        <div className="flex items-center gap-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-[15px] py-2 text-base font-semibold text-[#0F0F0F]"
          >
            <img
              src="/assets/contract-management/payment-summary/share.svg"
              className="h-5 w-5"
            />
            Export Report
          </button>

          {isManager && (
            <div className="inline-flex items-start gap-6">
              <UpdateSavingsDialog
                contractId={contractId}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-[15px] py-2 text-base font-semibold text-[#0F0F0F]"
                  >
                    Update Savings
                  </button>
                }
              />

              <ReleaseHoldbackDialog
                contractId={contractId}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-[#2A4467] px-4 py-2 text-base font-semibold text-white"
                  >
                    Release Holdback
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {(holdbacksLoading || savingsLoading) && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
          Loading payment data…
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-x-6 gap-y-6">
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Contract Value
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {contractValue}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Contigency
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {contigency}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Holdback</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {holdbackValue}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Holdback Amount
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {holdbackAmount}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Holdback Released
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {holdbackReleased}
            </div>
          </div>
          {isManager && (
            <div className="flex flex-col justify-center gap-4">
              <div className="text-[18px] leading-7 text-[#6B6B6B]">
                Savings Realized
              </div>
              <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
                {savingAmount}
              </div>
            </div>
          )}

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Payment Structure
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {paymentStructure}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Payment Term
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              {paymentTerm}
            </div>
          </div>
          <div />
        </div>
      </div>

      <Tabs
        defaultValue="milestones"
        className="w-full bg-transparent space-y-8"
      >
        <TabsList className="bg-[#F3F4F6] p-2 h-fit rounded-full w-fit">
          <TabsTrigger
            value="milestones"
            className="rounded-full px-6 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            MileStones
          </TabsTrigger>
          <TabsTrigger
            value="holdback-release"
            className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Holdback Release
          </TabsTrigger>
          {(isManager || isApprover) && (
            <TabsTrigger
              value="saving-realized"
              className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
            >
              Savings Realized
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="milestones">
          <PaymentSummaryMilestonesTable
            rows={milestoneRows}
            getRowSearchValues={(row) => [
              row.milestoneId,
              row.milestoneTitle,
              row.deliverable,
              row.amount,
              row.dueDate,
            ]}
          />
          {!holdbacksLoading &&
            !savingsLoading &&
            isVendor &&
            milestoneRows.length === 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
                No milestones found.
              </div>
            )}
        </TabsContent>

        <TabsContent value="holdback-release">
          <PaymentSummaryMilestonesTable
            title="Holdback Release"
            rows={holdbackRows}
            columns={holdbackReleaseColumns}
            getRowSearchValues={(row) => [
              row.releaseId,
              row.releasedType,
              row.releasedAmount,
              row.status,
              row.dueDate,
            ]}
          />
          {!holdbacksLoading && isVendor && holdbackRows.length === 0 && (
            <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
              No holdback releases available.
            </div>
          )}
        </TabsContent>

        {(isManager || isApprover) && (
          <TabsContent value="saving-realized">
            <PaymentSummaryMilestonesTable<SavingsRealizedRow>
              title="Savings"
              rows={savingsRows}
              columns={savingsRealizedColumns}
              getRowSearchValues={(row) => [
                row.savingsId,
                row.savingsTitle,
                row.category,
                row.amount,
                row.dateSubmitted,
              ]}
            />
            {!savingsLoading && savingsRows.length === 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
                No savings records found.
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </TabsContent>
  );
};

export default PaymentSummaryTabContent;
