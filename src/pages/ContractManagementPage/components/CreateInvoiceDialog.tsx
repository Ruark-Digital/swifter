import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Forge,
  Forger,
  useFieldArray,
  useForge,
  useForgeValues,
} from "@/lib/forge";
import {
  TextArea,
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { X, Plus, Trash2, FileText, UploadCloud, Edit2 } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormContext, useWatch } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatFileSize, getSimpleFileExtension } from "@/lib/fileUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import type { UploadURLs } from "../lib/contractChanges";
import { vendorApi } from "../api/vendorApi";
import type { ContractInvoiceDTO } from "../api/contractManagerApi";
import { useToastHandler } from "@/hooks/useToaster";

type Props = {
  trigger: React.ReactElement;
  contractId: string;
  createPath?: string;
  invalidateQueryKey?: readonly unknown[];
  mode?: "create" | "edit";
  invoiceId?: string;
  initialInvoice?: ContractInvoiceDTO & {
    items?: Array<{
      component?: string;
      description?: string;
      quantity?: number;
      unitOfmeasurement?: string;
      unitPrice?: number;
    }>;
  };
};

const TAX_CODE_TO_FORM: Record<string, string> = {
  HST: "hst",
  GST: "gst",
  "PST/QST": "pst_qst",
  Others: "others",
};

type InvoiceItem = {
  itemComponent?: string;
  description?: string;
  quantity?: string;
  unitMeasurement?: string;
  unitPrice?: string;
  total?: string;
};

type FormValues = {
  invoiceTitle: string;
  invoiceType?: string;
  milestonePayment?: string;
  taxCode?: string;
  otherTaxValue?: string;
  description?: string;
  uploadMode?: "manual" | "file";
  invoiceAmount?: string;
  total?: number;
  items?: InvoiceItem[];
  files?: File[] | null;
};

const schema = yup.object({
  invoiceTitle: yup.string().required("Invoice Title is required"),
  invoiceType: yup.string().optional(),
  milestonePayment: yup.string().optional(),
  taxCode: yup.string().optional(),
  otherTaxValue: yup.string().optional(),
  description: yup.string().optional(),
  uploadMode: yup
    .mixed<"manual" | "file">()
    .oneOf(["manual", "file"])
    .optional(),
  invoiceAmount: yup.string().optional(),
  total: yup.number().optional(),
  items: yup
    .array(
      yup.object({
        itemComponent: yup.string().optional(),
        description: yup.string().optional(),
        quantity: yup.string().optional(),
        unitMeasurement: yup.string().optional(),
        unitPrice: yup.string().optional(),
        total: yup.string().optional(),
      }),
    )
    .optional(),
});

const INVOICE_TYPES = [
  { label: "Progress Draw", value: "progress draw" },
  { label: "Monthly Payment", value: "monthly payment" },
  { label: "Milestone Payment", value: "milestone payment" },
  { label: "Holdback", value: "holdback" },
];

const TAX_CODES = [
  { label: "HST", value: "hst" },
  { label: "GST", value: "gst" },
  { label: "PST/QST", value: "pst_qst" },
  { label: "Others", value: "others" },
];

const EMPTY_ITEM: InvoiceItem = {
  itemComponent: "",
  description: "",
  quantity: "",
  unitMeasurement: "",
  unitPrice: "",
  total: "",
};

type FooterProps = {
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  isSubmitting?: boolean;
};

const Footer = React.memo(
  ({ onBack, primaryLabel, onPrimary, isSubmitting }: FooterProps) => (
    <div className="sticky bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-900 px-2 py-6 border-t border-[#E5E7EB] dark:border-slate-700">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-12 flex-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPrimary}
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  ),
);

type InvoiceInputRowProps = {
  id: string;
  index: number;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
};

const InvoiceInputRow = ({
  id,
  index,
  onRemoveRow,
  onAddRow,
}: InvoiceInputRowProps) => {
  return (
    <div
      key={id}
      className="px-6 py-3 grid grid-cols-[40px_1fr_1fr_100px_160px_120px_120px_100px] gap-4 items-center"
    >
      <div className="text-sm text-[#6B7280] dark:text-slate-400">{index + 1}</div>
      <Forger
        name={`items.${index}.itemComponent`}
        component="input"
        type="text"
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        placeholder="Item 2"
      />
      <Forger
        name={`items.${index}.description`}
        component="input"
        type="text"
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        placeholder="Long Input"
      />
      <Forger
        name={`items.${index}.quantity`}
        component="input"
        type="text"
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        placeholder="Enter Value"
      />
      <Forger
        name={`items.${index}.unitMeasurement`}
        component="input"
        type="text"
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        placeholder="Enter Value"
      />
      <Forger
        name={`items.${index}.unitPrice`}
        component="input"
        type="text"
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm dark:bg-slate-800 dark:text-slate-100"
        placeholder="Enter Value"
      />
      <Forger
        name={`items.${index}.total`}
        component="input"
        type="text"
        readOnly
        className="h-10 rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-3 text-sm text-slate-500 dark:text-slate-400 dark:bg-slate-800"
        placeholder="Subtotal"
      />

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onAddRow}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400"
        >
          <Plus className="h-4 w-4" />
        </button>
        {index > 0 && (
          <button
            type="button"
            onClick={() => onRemoveRow(index)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-[#EF4444]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

type CompleteInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement;
  onCompleteInvoice: () => void;
};

const CompleteInvoiceDialog = React.memo(
  ({ open, onOpenChange, trigger, onCompleteInvoice }: CompleteInvoiceDialogProps) => {
    const { control, unregister } = useFormContext<FormValues>();
    const { setValue } = useForgeValues<FormValues>({ control });

    const [totalAmount, setTotalAmount] = React.useState(0);

    const watchedItems = useWatch({
      control,
      name: "items",
    }) as InvoiceItem[] | undefined;

    React.useEffect(() => {
      if (!watchedItems || !Array.isArray(watchedItems)) {
        setTotalAmount(0);
        return;
      }

      let total = 0;

      watchedItems.forEach((item, index) => {
        const quantity = parseFloat(item?.quantity ?? "") || 0;
        const unitPrice = parseFloat(item?.unitPrice ?? "") || 0;
        const subtotal = quantity * unitPrice;

        total += subtotal;

        const currentTotal = parseFloat(item?.total ?? "") || 0;
        const shouldClearSubtotal =
          subtotal === 0 && (item?.total ?? "") !== "";
        const hasChanged =
          subtotal !== 0 && Math.abs(currentTotal - subtotal) > 0.005;

        if (shouldClearSubtotal || hasChanged) {
          const nextValue = subtotal === 0 ? "" : subtotal.toString();
          setValue(`items.${index}.total` as any, nextValue);
        }
      });

      setTotalAmount(total);
      setValue("total", total as any);
    }, [watchedItems, setValue]);

    const { fields, append, remove } = useFieldArray({
      name: "items" as unknown as string,
      control,
    } as any);

    const handleAddRow = React.useCallback(() => {
      append(EMPTY_ITEM as any);
    }, [append]);

    const handleRemoveRow = React.useCallback(
      (index: number) => {
        const fieldNames = [
          `items.${index}.itemComponent`,
          `items.${index}.description`,
          `items.${index}.quantity`,
          `items.${index}.unitMeasurement`,
          `items.${index}.unitPrice`,
          `items.${index}.total`,
        ];

        fieldNames.forEach((fieldName) => {
          unregister(fieldName as keyof FormValues);
        });

        remove(index);
      },
      [remove, unregister],
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <div className="flex items-center justify-between px-8 pt-8">
            <DialogTitle className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
              Complete Invoice
            </DialogTitle>
          </div>
          <div className="px-8 pb-8 pt-6">
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-700 px-6 py-4">
                <div className="text-sm font-semibold text-[#6B7280] dark:text-slate-400 grid grid-cols-[40px_1fr_1fr_100px_160px_120px_120px_100px] gap-4 w-full">
                  <span>#</span>
                  <span>Item/Component</span>
                  <span>Description</span>
                  <span>Quantity</span>
                  <span>Unit of Measurement</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                  <span className="text-right">Actions</span>
                </div>
              </div>

              <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                {fields.map((field, index) => (
                  <InvoiceInputRow
                    {...{
                      id: field.id,
                      index,
                      onRemoveRow: handleRemoveRow,
                      onAddRow: handleAddRow,
                    }}
                  />
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-slate-700 px-6 py-4">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2A4467] dark:text-blue-300"
                >
                  <Plus className="h-4 w-4" /> Add More
                </button>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-[#6B7280] dark:text-slate-400">Total</span>
                  <span className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Button Footer */}
            <div className="sticky bottom-0 left-0 right-0 z-10 bg-white dark:bg-slate-900 px-0 py-6">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-12 px-12 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCompleteInvoice();
                    onOpenChange(false);
                  }}
                  className="h-12 px-6 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
                >
                  Complete Invoice
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

function RadioGroupDemo({
  onChange, 
  values,
}: {
  onChange: (value: string) => void;
  values: string;
}) {
  const { unregister, setValue } = useFormContext<FormValues>();

  const handleModeChange = React.useCallback(
    (nextValue: string) => {
      const previousValue = values;

      if (previousValue === "manual" && nextValue === "file") {
        unregister("items");
        setValue("items", undefined);
        setValue("total", 0);
      }

      if (previousValue === "file" && nextValue === "manual") {
        unregister("files");
        setValue("files", []);
        setValue("total", 0);
      }

      onChange(nextValue);
    },
    [onChange, unregister, setValue, values],
  );

  return (
    <RadioGroup
      defaultValue="manual"
      value={values}
      onValueChange={handleModeChange}
      className="w-fit flex items-center gap-4"
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="manual" id="r1" />
        <Label htmlFor="r1" className="text-[#0F0F0F] dark:text-slate-100">
          Manual
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="file" id="r2" />
        <Label htmlFor="r2" className="text-[#0F0F0F] dark:text-slate-100">
          Upload File
        </Label>
      </div>
    </RadioGroup>
  );
}

const UploadElement = () => {
  return (
    <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#9CA3AF] dark:border-slate-600 bg-white dark:bg-slate-800 px-4">
      <UploadCloud className="h-10 w-10 text-[#2A4467] dark:text-blue-300" />
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-sm font-semibold text-[#2A4467] dark:text-blue-300">
          Drag &amp; Drop or Click to choose files
        </div>
        <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </div>
      </div>
    </div>
  );
};

const FilesListItem = ({ file, index }: { file: File; index?: number }) => {
  // TextFileUploader calls List with { file, control, index } — not
  // value/onChange — so the previous remove handler silently no-op'd.
  // Pull the live files array off form context, splice by index, and
  // write back. Index is more reliable than name because dropzone
  // allows duplicates and a name-match would remove both rows.
  const { setValue } = useFormContext<{ files: File[] | null }>();
  const value = useWatch({ name: "files" }) as File[] | null | undefined;

  const handleRemove = () => {
    if (typeof index !== "number") return;
    const next = (value ?? []).filter((_, i) => i !== index);
    setValue("files", next.length > 0 ? next : null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[#EAF1FB] dark:bg-slate-700">
          <FileText className="h-5 w-5 text-[#2A4467] dark:text-blue-300" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium max-w-xs text-[#0F0F0F] dark:text-slate-100">
            {file.name}
          </div>
          <div className="text-xs font-medium text-[#9CA3AF] dark:text-slate-400">
            {getSimpleFileExtension(file.name).toUpperCase()} •{" "}
            {formatFileSize(file.size)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="inline-flex h-8 w-8 items-center justify-center text-[#9CA3AF] dark:text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

type InvoiceComponentProps = {
  completeOpen: boolean;
  handleCompleteOpenChange: (nextOpen: boolean) => void;
  invoiceCompleted: boolean;
  onInvoiceCompleted: () => void;
};

const InvoiceComponent = ({
  completeOpen,
  handleCompleteOpenChange,
  invoiceCompleted,
  onInvoiceCompleted,
}: InvoiceComponentProps) => {
  const mode = useWatch({ name: "uploadMode" });

  const trigger = invoiceCompleted ? (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#2A4467] px-4 py-[23px]"
    >
      <span className="text-base font-semibold text-white">Invoice</span>
      <span className="inline-flex items-center gap-2">
        <Edit2 className="h-5 w-5 text-white" />
        <span className="text-base font-semibold text-white">Edit Invoice</span>
      </span>
    </button>
  ) : (
    <button
      type="button"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-slate-700 py-3.5"
    >
      <Plus className="h-4 w-4 text-[#2A4467] dark:text-blue-300" />
      <span className="text-[#2A4467] dark:text-blue-300 text-base font-semibold">
        Create Invoice
      </span>
    </button>
  );

  return mode === "manual" ? (
    <CompleteInvoiceDialog
      open={completeOpen}
      onOpenChange={handleCompleteOpenChange}
      onCompleteInvoice={onInvoiceCompleted}
      trigger={trigger}
    />
  ) : (
    <Forger
      name="files"
      component={TextFileUploader}
      element={<UploadElement />}
      List={FilesListItem}
      accept={
        {
          "application/pdf": [".pdf"],
          "application/msword": [".doc"],
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            [".docx"],
          "application/vnd.ms-excel": [".xls"],
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
            ".xlsx",
          ],
          "application/zip": [".zip"],
          "image/png": [".png"],
          "image/jpeg": [".jpeg", ".jpg"],
        } as any
      }
    />
  );
};

const CreateInvoiceDialog: React.FC<Props> = ({
  trigger,
  contractId,
  createPath,
  invalidateQueryKey,
  mode = "create",
  invoiceId,
  initialInvoice,
}) => {
  const isEditMode = mode === "edit" && Boolean(invoiceId);
  const [open, setOpen] = React.useState(false);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  // In edit mode the invoice already exists, so we don't gate submission
  // behind the "Complete Invoice" sub-dialog (which is only for new manual
  // invoices that need their item list populated).
  const [invoiceCompleted, setInvoiceCompleted] = React.useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();

  const { mutateAsync: uploadFile } = useMutation<
    ApiResponse<UploadURLs[]>,
    ApiResponseError,
    { file: File }
  >({
    mutationKey: ["uploadInvoiceFile"],
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

  const createInvoiceMutation = useMutation({
    mutationKey: ["createInvoice", contractId],
    mutationFn: async (payload: {
      title: string;
      description: string;
      type: "progress draw" | "monthly payment" | "milestone payment" | "holdback";
      taxCode: "HST" | "GST" | "PST/QST" | "Others";
      status: "active" | "draft";
      fileType: "manual" | "file";
      taxValue?: number;
      amount?: number;
      files?: { name: string; url: string; type: string; size: string }[];
      items?: Array<{
        component?: string;
        description?: string;
        quantity?: number;
        unitOfmeasurement?: string;
        unitPrice?: number;
      }>;
    }) => {
      if (isEditMode && invoiceId) {
        return await vendorApi.updateInvoice(contractId, invoiceId, payload);
      }
      if (createPath) {
        const res = await postRequest({
          url: createPath,
          payload,
        });
        return res.data;
      }
      return await vendorApi.createInvoice(contractId, payload);
    },
    onSuccess: async () => {
      toastHandler.success(
        "Success",
        isEditMode
          ? "Invoice updated successfully"
          : "Invoice submitted successfully",
      );
      await queryClient.invalidateQueries({
        queryKey: invalidateQueryKey ?? ["contractInvoices"],
      });
      if (isEditMode) {
        await queryClient.invalidateQueries({
          queryKey: ["contractInvoiceDetail", contractId, invoiceId],
        });
      }
      setOpen(false);
      setCompleteOpen(false);
      setInvoiceCompleted(false);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to submit invoice",
      );
    },
  });

  const editDefaults = React.useMemo<FormValues>(() => {
    if (!isEditMode || !initialInvoice) {
      return {
        invoiceTitle: "",
        invoiceType: undefined,
        milestonePayment: undefined,
        taxCode: undefined,
        otherTaxValue: "",
        description: "",
        uploadMode: "manual",
        total: 0,
        invoiceAmount: "",
      };
    }
    const mode: "manual" | "file" =
      initialInvoice.fileType ?? initialInvoice.inputType ?? "manual";
    return {
      invoiceTitle: initialInvoice.title ?? "",
      invoiceType: initialInvoice.type,
      milestonePayment: undefined,
      taxCode: initialInvoice.taxCode
        ? TAX_CODE_TO_FORM[initialInvoice.taxCode] ?? initialInvoice.taxCode
        : undefined,
      otherTaxValue:
        typeof initialInvoice.taxValue === "number"
          ? String(initialInvoice.taxValue)
          : "",
      description: initialInvoice.description ?? "",
      uploadMode: mode,
      total:
        mode === "manual" && typeof initialInvoice.amount === "number"
          ? initialInvoice.amount
          : 0,
      invoiceAmount:
        mode === "file" && typeof initialInvoice.amount === "number"
          ? String(initialInvoice.amount)
          : "",
      items:
        mode === "manual" && Array.isArray(initialInvoice.items)
          ? initialInvoice.items.map((it) => ({
              itemComponent: it.component ?? "",
              description: it.description ?? "",
              quantity:
                typeof it.quantity === "number" ? String(it.quantity) : "",
              unitMeasurement: it.unitOfmeasurement ?? "",
              unitPrice:
                typeof it.unitPrice === "number" ? String(it.unitPrice) : "",
              total:
                typeof it.quantity === "number" &&
                typeof it.unitPrice === "number"
                  ? String(it.quantity * it.unitPrice)
                  : "",
            }))
          : undefined,
    };
  }, [isEditMode, initialInvoice]);

  const { control, reset, getValues, setValue, handleSubmit } =
    useForge<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: editDefaults,
    });

  React.useEffect(() => {
    if (open && isEditMode) {
      reset(editDefaults);
      setInvoiceCompleted(true);
    }
  }, [open, isEditMode, editDefaults, reset]);

  const onSubmit = React.useCallback(
    async (values: FormValues) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const uploadMode = values.uploadMode ?? "manual";

        const taxCodeEnum =
          values.taxCode === "hst"
            ? "HST"
            : values.taxCode === "gst"
              ? "GST"
              : values.taxCode === "pst_qst"
                ? "PST/QST"
                : values.taxCode === "others"
                  ? "Others"
                  : undefined;

        if (!taxCodeEnum) {
          toastHandler.error(
            "Missing Tax Code",
            "Please select a tax code before submitting the invoice.",
          );
          return;
        }

        let filesPayload:
          | {
              name: string;
              url: string;
              type: string;
              size: string;
            }[]
          | undefined;

        if (uploadMode === "file" && Array.isArray(values.files) && values.files.length > 0) {
          const responses = await Promise.all(
            values.files.map((file) => uploadFile({ file })),
          );

          filesPayload = responses
            .map((res, index) => {
              const uploaded = res.data?.data?.[0];
              const original = values.files?.[index];
              if (!uploaded?.url || !original) return null;
              return {
                name: original.name,
                url: uploaded.url,
                type: getSimpleFileExtension(original.name).toUpperCase(),
                size: original.size.toString(),
              };
            })
            .filter(Boolean) as {
            name: string;
            url: string;
            type: string;
            size: string;
          }[];
        }

        let itemsPayload:
          | Array<{
              component?: string;
              description?: string;
              quantity?: number;
              unitOfmeasurement?: string;
              unitPrice?: number;
            }>
          | undefined;

        if (uploadMode === "manual" && Array.isArray(values.items)) {
          itemsPayload = values.items
            .map((item) => {
              const quantity = parseFloat(item.quantity ?? "");
              const unitPrice = parseFloat(item.unitPrice ?? "");
              const quantityNum = Number.isFinite(quantity) ? quantity : undefined;
              const unitPriceNum = Number.isFinite(unitPrice) ? unitPrice : undefined;

              const component =
                typeof item.itemComponent === "string" && item.itemComponent.trim()
                  ? item.itemComponent.trim()
                  : undefined;
              const description =
                typeof item.description === "string" && item.description.trim()
                  ? item.description.trim()
                  : undefined;
              const unitOfmeasurement =
                typeof item.unitMeasurement === "string" && item.unitMeasurement.trim()
                  ? item.unitMeasurement.trim()
                  : undefined;

              const hasContent =
                component ||
                description ||
                unitOfmeasurement ||
                quantityNum !== undefined ||
                unitPriceNum !== undefined;

              if (!hasContent) return null;

              return {
                component,
                description,
                quantity: quantityNum,
                unitOfmeasurement,
                unitPrice: unitPriceNum,
              };
            })
            .filter(Boolean) as Array<{
            component?: string;
            description?: string;
            quantity?: number;
            unitOfmeasurement?: string;
            unitPrice?: number;
          }>;
        }

        const amountFromTotal =
          uploadMode === "manual"
            ? typeof values.total === "number" && Number.isFinite(values.total)
              ? values.total
              : undefined
            : (() => {
                const parsed = Number.parseFloat(values.invoiceAmount ?? "");
                return Number.isFinite(parsed) ? parsed : undefined;
              })();

        if (uploadMode === "file" && typeof amountFromTotal !== "number") {
          toastHandler.error(
            "Missing Invoice Amount",
            "Please enter invoice amount when using file upload mode.",
          );
          return;
        }

        const taxValueParsed = values.otherTaxValue
          ? Number.parseFloat(values.otherTaxValue)
          : undefined;
        const taxValue =
          typeof taxValueParsed === "number" && Number.isFinite(taxValueParsed)
            ? taxValueParsed
            : undefined;

        const rawInvoiceType = values.invoiceType;
        let invoiceTypeValue:
          | "progress draw"
          | "monthly payment"
          | "milestone payment"
          | "holdback" = "progress draw";

        if (
          rawInvoiceType === "progress draw" ||
          rawInvoiceType === "monthly payment" ||
          rawInvoiceType === "milestone payment" ||
          rawInvoiceType === "holdback"
        ) {
          invoiceTypeValue = rawInvoiceType;
        }

        const payload: {
          title: string;
          description: string;
          type: "progress draw" | "monthly payment" | "milestone payment" | "holdback";
          taxCode: "HST" | "GST" | "PST/QST" | "Others";
          status: "active" | "draft";
          fileType: "manual" | "file";
          taxValue?: number;
          amount?: number;
          files?: { name: string; url: string; type: string; size: string }[];
          items?: Array<{
            component?: string;
            description?: string;
            quantity?: number;
            unitOfmeasurement?: string;
            unitPrice?: number;
          }>;
        } = {
          title: values.invoiceTitle,
          description: values.description ?? "",
          type: invoiceTypeValue,
          taxCode: taxCodeEnum,
          status: "active",
          fileType: uploadMode,
        };

        if (typeof taxValue === "number") {
          payload.taxValue = taxValue;
        }

        if (typeof amountFromTotal === "number") {
          payload.amount = amountFromTotal;
        }

        if (filesPayload && filesPayload.length > 0) {
          payload.files = filesPayload;
        }

        if (itemsPayload && itemsPayload.length > 0) {
          payload.items = itemsPayload;
        }

        await createInvoiceMutation.mutateAsync(payload);
        reset();
      } catch (error) {
        toastHandler.error(
          "Submission Failed",
          "An error occurred while submitting the invoice. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createInvoiceMutation, isSubmitting, reset, toastHandler, uploadFile],
  );
  
  const handleBack = React.useCallback(() => setOpen(false), []);

  const handlePrimary = React.useCallback(() => {
    const { uploadMode } = getValues();
    if (uploadMode === "manual" && !invoiceCompleted) {
      setCompleteOpen(true);
      return;
    }
    handleSubmit(onSubmit)();
  }, [getValues, handleSubmit, onSubmit, invoiceCompleted]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isSubmitting) return;
        setOpen(o);
        if (!o) {
          reset();
          setCompleteOpen(false);
          setInvoiceCompleted(false);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-4 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
            {isEditMode ? "Edit Invoice" : "Create Invoice"}
          </DialogTitle>
        </div>

        <div className="px-8 pt-6">
          <Forge
            control={control}
            onSubmit={onSubmit}
            className="space-y-5"
            // debug
          >
            <Forger
              name="invoiceTitle"
              label="Invoice Title"
              placeholder="Enter title"
              component={TextInput}
            />
            <Forger
              name="invoiceType"
              label="Invoice Type"
              placeholder="Select Category"
              options={INVOICE_TYPES}
              component={TextSelect}
            />
            <Forger
              name="taxCode"
              label="Tax Code"
              placeholder="Select Category"
              options={TAX_CODES}
              component={TextSelect}
            />
            <Forger
              name="description"
              label="Description"
              placeholder="Enter description"
              rows={5}
              component={TextArea}
            />

            <div className="space-y-4">
              <Forger name="uploadMode" component={RadioGroupDemo} />
              {useWatch({ control, name: "uploadMode" }) === "file" && (
                <Forger
                  name="invoiceAmount"
                  label="Invoice Amount"
                  placeholder="Enter invoice amount"
                  component={TextInput}
                />
              )}
              <InvoiceComponent
                completeOpen={completeOpen}
                handleCompleteOpenChange={(open) => {
                  if (open) setValue("items", [EMPTY_ITEM] as any);
                  setCompleteOpen(open);
                }}
                invoiceCompleted={invoiceCompleted}
                onInvoiceCompleted={() => setInvoiceCompleted(true)}
              />
            </div>

            <div className="pb-4" />

            <Footer
              onBack={handleBack}
              onPrimary={handlePrimary}
              primaryLabel={isEditMode ? "Update Invoice" : "Create Invoice"}
              isSubmitting={isSubmitting}
            />
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
