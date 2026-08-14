import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PaymentSummaryMilestonesTable from "../components/PaymentSummaryMilestonesTable";
import type { ColumnDef } from "@tanstack/react-table";
import ReleaseHoldbackDialog from "../components/ReleaseHoldbackDialog";
import HoldbackDetailsSheet from "../components/HoldbackDetailsSheet";
import SavingsDetailsSheet from "../components/SavingsDetailsSheet";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
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
import {
  formatDateTZ,
  resolveCurrency,
  resolveMilestoneDeliverableName,
} from "@/lib/utils";
import { useUser } from "@/store/authSlice";
import { useUserRole } from "@/hooks/useUserRole";
import { useFormContext } from "react-hook-form";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import { getHoldbackStatusBadgeProps } from "../lib/holdbacks";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Spinner from "@/components/ui/Spinner";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

function SavingsFileListItem({ file }: { file: File }) {
  const { setValue, getValues } = useFormContext();
  const handleRemove = () => {
    const current = (getValues("files") as File[] | undefined) || [];
    setValue(
      "files",
      current.filter((v: File) => v.name !== file.name),
    );
  };
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

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

const buildHoldbackReleaseColumns = (
  contractId: string,
  contractType: "Contract" | "MsaContract" = "Contract",
): ColumnDef<HoldbackReleaseRow>[] => [
  {
    accessorKey: "releaseId",
    header: "Release ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedType",
    header: "Released Type",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-medium text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "releasedAmount",
    header: () => <div className="w-[140px] text-center">Released Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-semibold text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="w-[120px] text-center">Status</div>,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const badge = getHoldbackStatusBadgeProps(value);
      return (
        <div className="flex w-[120px] justify-center py-4">
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold ${badge.className}`}
          >
            {badge.label}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: () => <div className="w-[120px] text-center">Release Date</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-medium text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="w-[80px] text-center">Action</div>,
    cell: ({ row }) => (
      <HoldbackDetailsSheet
        holdBackId={row.getValue<string>("releaseId")}
        currency={row.getValue<string>("currency")}
        contractId={contractId}
        contractType={contractType}
        trigger={
          <button
            type="button"
            className="text-sm font-semibold text-[#16A34A] underline underline-offset-2"
          >
            View
          </button>
        }
      />
    ),
  },
];

const buildSavingsRealizedColumns = (
  contractId: string,
): ColumnDef<SavingsRealizedRow>[] => [
  {
    accessorKey: "savingsId",
    header: "Savings ID",
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-sm font-semibold text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "savingsTitle",
    header: "Savings Title",
    cell: ({ getValue }) => (
      <div className="w-[220px] py-4 text-sm font-medium leading-5 text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <div className="w-[190px] py-4 text-sm font-medium text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="w-[120px] text-center">Amount</div>,
    cell: ({ getValue }) => (
      <div className="w-[120px] py-4 text-center text-sm font-semibold text-[#374151] dark:text-slate-300">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "dateSubmitted",
    header: () => <div className="w-[140px] text-center">Date Submitted</div>,
    cell: ({ getValue }) => (
      <div className="w-[140px] py-4 text-center text-sm font-medium text-[#374151] dark:text-slate-300">
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
          contractId={contractId}
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
      <CloudUpload className="h-12 w-12 text-[#2A4467] dark:text-blue-300" />
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-[#2A4467] dark:text-blue-300">
          Drag &amp; Drop or Click to choose files
        </p>
        <p className="text-sm text-[#6B7280] dark:text-slate-400">
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

  const { control, reset } = useForge<UpdateSavingsFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      title: "",
      amount: "",
      category: "",
      description: "",
      files: null,
    },
  });

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
        size: string;
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
                size: res.data?.data?.[0].size ?? "",
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
      toastHandler.error(
        "Submission Failed",
        "An error occurred while submitting the form. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
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
                    { label: "Others", value: "Others" },
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
                <div className="text-sm font-medium text-[#6B6B6B] dark:text-slate-400">
                  Upload Files
                </div>
                <Forger
                  name="files"
                  component={TextFileUploader}
                  element={<UploadElement />}
                  List={SavingsFileListItem}
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
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
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
            <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
              Savings Updated Successfully
            </div>
            <div className="flex w-full items-center gap-4">
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
  currency?: string;
  contract?: ContractDetail | null;
  isActive?: boolean;
};

const PaymentSummaryTabContent: React.FC<Props> = ({
  contractId,
  contract,
  isActive,
}) => {
  const { isVendor, isProjectManager, isManager, isApprover, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const isPendingApproval = contract?.status === "pending_approval";

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
      if (isContractVendorLike) {
        const res = await getRequest({
          url: `/contract/vendor/contracts/${contractId}/payment-holdbacks`,
        });
        return res.data as { message?: string; data?: any[] };
      }
      return { data: [] as any[] };
    },
    enabled:
      Boolean(contractId) &&
      !!isActive &&
      (isManager || isApprover || isContractVendorLike),
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
      // Phase 2 docs do not expose `/vendor/contracts/{contractId}/payment-savings`.
      // Vendor + project manager intentionally do not fetch savings.
      return { data: [] as any[] };
    },
    enabled:
      Boolean(contractId) && !!isActive && (isManager || isApprover),
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

  // QA #157: Billed Till Date + Current Balance come straight from the
  // contract-detail response (`billedAmount` / `currentBalance`).
  // QA #239: the reviewer asked for these on the Vendor PM "and other profiles"
  // too, not just CM/PL — show them to every payment-summary viewer. The values
  // read from the shared `contract` object (which every role's detail fetch
  // populates) and `formatMoney` degrades gracefully if a role's payload omits
  // them. (Reviewer also flagged the Current Balance VALUE needs a BE fix —
  // that is server-side, tracked separately.)
  const showBilledAndBalance =
    isManager || isApprover || isContractVendorLike || isViewOnly;

  const currency = resolveCurrency(contract?.currency, useUser()?.currency);
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
      dueDate: formatDateTZ(holdback?.releasedDate, "dd MMM yyyy") ?? "-",
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
      dateSubmitted: formatDateTZ(saving?.submittedDate, "dd MMM yyyy") ?? "-",
    }));
  }, [formatMoney, savingsResponse?.data, currency]);

  const holdbackReleaseColumns = React.useMemo(
    () => buildHoldbackReleaseColumns(contractId, "Contract"),
    [contractId],
  );

  const savingsRealizedColumns = React.useMemo(
    () => buildSavingsRealizedColumns(contractId),
    [contractId],
  );

  // BE returns `milestone[].deliverable` as the deliverable's _id (or a
  // populated object / legacy name). Build a _id -> name map from the
  // contract's deliverables so the column shows the deliverable name, not the
  // milestone title (QA #47).
  const deliverableNameById = React.useMemo(
    () =>
      new Map<string, string>(
        (Array.isArray((contract as any)?.deliverables)
          ? (contract as any).deliverables
          : []
        )
          .filter((d: any) => d?._id && d?.name)
          .map((d: any) => [String(d._id), String(d.name)]),
      ),
    [contract],
  );

  const milestoneRows = React.useMemo(() => {
    const milestones = Array.isArray(contract?.milestone)
      ? contract?.milestone
      : [];
    return milestones.map((milestone: any, index: number) => {
      const dueDate = milestone?.dueDate
        ? formatDateTZ(milestone?.dueDate, "dd MMM yyyy")
        : "-";
      return {
        milestoneId: milestone?.milestoneId ?? `milestone-${index + 1}`,
        milestoneTitle: milestone?.name ?? "-",
        deliverable:
          resolveMilestoneDeliverableName(
            milestone?.deliverable,
            deliverableNameById,
          ) || "-",
        amount: formatMoney(milestone?.amount),
        dueDate,
      };
    });
  }, [contract?.milestone, deliverableNameById, formatMoney]);

  const contractValue = formatMoney(contract?.contractValue);
  const holdbackReleased = formatMoney(contract?.holdBackReleased);
  const savingAmount = formatMoney(contract?.savingAmount);
  const holdbackValue =
    contract?.holdBack != null ? String(contract?.holdBack) : "-";
  const holdbackAmount =
    contract?.holdBackBank != null ? formatMoney(contract?.holdBackBank) : "-";
  const contigency =
    formatMoney(Number(contract?.contingency ?? contract?.contigency)) ?? "-";
  const paymentStructure = contract?.paymentStructure ?? "-";
  const paymentTerm = contract?.paymentTerms?.name ?? "-";

  return (
    <TabsContent value="payment-summary" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
          Payment Summary
        </h3>

        <div className="flex items-center gap-6">
          <ExportReportSheet contractId={contractId} contractType="Contract">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-slate-700 px-[15px] py-2 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <img
                src="/assets/contract-management/payment-summary/share.svg"
                className="h-5 w-5"
                alt=""
              />
              Export Report
            </button>
          </ExportReportSheet>

          {isManager && !isPendingApproval && (
            <div className="inline-flex items-start gap-6">
              <UpdateSavingsDialog
                contractId={contractId}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 px-[15px] py-2 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
                  >
                    Update Savings
                  </button>
                }
              />
            </div>
          )}

          {/* #142 — the Vendor-PM submits a holdback release application; the CM
              then accepts/rejects it in the holdback detail sheet and the
              approver chain escalates from there. The manager no longer
              initiates the release directly for regular contracts (the BE has no
              manager create endpoint — only vendor submit + manager approve). */}
          {isProjectManager && !isPendingApproval && (
            <ReleaseHoldbackDialog
              contractId={contractId}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-[#2A4467] px-4 py-2 text-base font-semibold text-white"
                >
                  Apply for Holdback Release
                </button>
              }
            />
          )}
        </div>
      </div>

      {(holdbacksLoading || savingsLoading) && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/60 px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
          Loading payment data…
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-x-6 gap-y-6">
          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
              Contract Value
            </div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {contractValue}
            </div>
          </div>
          {/* Contingency is internal-only — hidden from the vendor/PM side (QA #132). */}
          {!isContractVendorLike && (
            <div className="flex flex-col justify-center gap-4">
              <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">Contigency</div>
              <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
                {contigency}
              </div>
            </div>
          )}
          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">Holdback</div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {holdbackValue === "-" ? "-" : `${holdbackValue}%`}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
              Holdback Amount
            </div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {holdbackAmount}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
              Holdback Released
            </div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {holdbackReleased}
            </div>
          </div>
          {isManager && (
            <div className="flex flex-col justify-center gap-4">
              <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
                Savings Realized
              </div>
              <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
                {savingAmount}
              </div>
            </div>
          )}

          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
              Payment Structure
            </div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {paymentStructure}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">Payment Term</div>
            <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
              {paymentTerm}
            </div>
          </div>
          {/* QA #157: Billed Till Date + Current Balance for manager/approver. */}
          {showBilledAndBalance && (
            <>
              <div className="flex flex-col justify-center gap-4">
                <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
                  Billed Till Date
                </div>
                <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
                  {formatMoney(contract?.billedAmount)}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4">
                <div className="text-sm leading-7 text-[#6B6B6B] dark:text-slate-400">
                  Current Balance
                </div>
                <div className="text-base font-semibold leading-7 text-[#0F0F0F] dark:text-slate-100">
                  {formatMoney(contract?.currentBalance)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="milestones"
        className="w-full bg-transparent space-y-8"
      >
        <TabsList className="bg-[#F3F4F6] dark:bg-slate-800 p-2 h-fit rounded-full w-fit">
          <TabsTrigger
            value="milestones"
            className="rounded-full px-6 py-1.5 text-base font-semibold text-[#6B6B6B] dark:text-slate-400 data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            MileStones
          </TabsTrigger>
          {!isViewOnly && (
            <TabsTrigger
              value="holdback-release"
              className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] dark:text-slate-400 data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
            >
              Holdback Release
            </TabsTrigger>
          )}
          {(isManager || isApprover) && (
            <TabsTrigger
              value="saving-realized"
              className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] dark:text-slate-400 data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
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
            isContractVendorLike &&
            milestoneRows.length === 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/60 px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
                No milestones found.
              </div>
            )}
        </TabsContent>

        {!isViewOnly && (
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
            {!holdbacksLoading &&
              isContractVendorLike &&
              holdbackRows.length === 0 && (
                <div className="mt-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/60 px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
                  No holdback releases available.
                </div>
              )}
          </TabsContent>
        )}

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
              <div className="mt-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/60 px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
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
