import React from "react";
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
  TextFileUploader,
  TextInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { Check, CloudUpload, X } from "lucide-react";

type HoldbackReleaseRow = {
  releaseId: string;
  releasedType: string;
  releasedAmount: string;
  status: "Approved" | "Pending";
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
      const value = getValue<HoldbackReleaseRow["status"]>();
      const styles =
        value === "Approved"
          ? "bg-[#EAF7EE] text-[#16A34A]"
          : "bg-[#FEF9C3] text-[#CA8A04]";
      return (
        <div className="flex w-[120px] justify-center py-4">
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-semibold ${styles}`}
          >
            {value}
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
    cell: () => (
      // <div className="flex justify-center py-4">
      <HoldbackDetailsSheet
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

const holdbackReleaseRows: HoldbackReleaseRow[] = [
  {
    releaseId: "HB-2025-10",
    releasedType: "Partial",
    releasedAmount: "$2.5M",
    status: "Approved",
    dueDate: "12-65-2025",
  },
  {
    releaseId: "HB-2025-10",
    releasedType: "Full",
    releasedAmount: "$2.5M",
    status: "Pending",
    dueDate: "12-65-2025",
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
    cell: () => (
      <div className="flex w-[80px] justify-center py-4">
        <SavingsDetailsSheet
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

const savingsRealizedRows: SavingsRealizedRow[] = [
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Direct Negotiations",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Indirect Savings",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Cost Avoidance",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
  {
    savingsId: "SR-2025-10",
    savingsTitle: "Additional structural reinforcement",
    category: "Working Capital Optimization",
    amount: "$2.5M",
    dateSubmitted: "12-65-2025",
  },
];

type UpdateSavingsFormValues = {
  title: string;
  amount: string;
  category: string;
  description: string;
  files: File[] | null;
};

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

const UpdateSavingsDialog: React.FC<{ trigger: React.ReactElement }> = ({
  trigger,
}) => {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  const { control, reset } = useForge<UpdateSavingsFormValues>({
    defaultValues: {
      title: "",
      amount: "",
      category: "",
      description: "",
      files: null,
    },
  });

  const handleSubmit = (data: UpdateSavingsFormValues) => {
    void data;
    setOpen(false);
    setSuccessOpen(true);
    reset();
  };

  const FileListItem = ({ file }: { file: File }) => {
    return <div className="hidden">{file.name}</div>;
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-[760px] gap-0 overflow-hidden rounded-2xl border-0 p-0"
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
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8 pt-6">
              <Forger
                name="title"
                label="Title"
                placeholder="Enter Amount"
                component={TextInput}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Forger
                  name="amount"
                  label="Amount"
                  placeholder="Enter Amount"
                  component={TextInput}
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
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
              >
                Back
              </button>
              <button
                type="submit"
                className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white"
              >
                Update
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
};

const PaymentSummaryTabContent: React.FC<Props> = ({ contractId }) => {
  void contractId;
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

          <div className="inline-flex items-start gap-6">
            <UpdateSavingsDialog
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-[15px] py-2 text-base font-semibold text-[#0F0F0F]"
                >
                  Update Saving
                </button>
              }
            />

            <ReleaseHoldbackDialog
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
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-x-6 gap-y-6">
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Contract Value
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $2,500,000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Contigency
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $1000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">Holdback</div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              10%
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Holdback Amount
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $250,000
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Holdback Released
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $10M
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Saving Realized
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              $0
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Payment Structure
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              Milestone
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="text-[18px] leading-7 text-[#6B6B6B]">
              Payment Term
            </div>
            <div className="text-[18px] font-semibold leading-7 text-[#0F0F0F]">
              NET 30
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
          <TabsTrigger
            value="saving-realized"
            className="rounded-full px-5 py-1.5 text-base font-semibold text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Saving Realized
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones">
          <PaymentSummaryMilestonesTable />
        </TabsContent>

        <TabsContent value="holdback-release">
          <PaymentSummaryMilestonesTable
            title="Holdback Release"
            rows={holdbackReleaseRows}
            columns={holdbackReleaseColumns}
            getRowSearchValues={(row) => [
              row.releaseId,
              row.releasedType,
              row.releasedAmount,
              row.status,
              row.dueDate,
            ]}
          />
        </TabsContent>

        <TabsContent value="saving-realized">
          <PaymentSummaryMilestonesTable<SavingsRealizedRow>
            title="Savings"
            rows={savingsRealizedRows}
            columns={savingsRealizedColumns}
            getRowSearchValues={(row) => [
              row.savingsId,
              row.savingsTitle,
              row.category,
              row.amount,
              row.dateSubmitted,
            ]}
          />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default PaymentSummaryTabContent;
