import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { businessDivisionApi, type BusinessDivision } from "../api/businessDivisionApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionId?: string | null;
  onEditDivision?: (division: BusinessDivision) => void;
};

const formatCompactCurrency = (value?: number) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 0,
  }).format(num);
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-2 font-quicksand">
      <p className="text-sm font-medium text-[#9CA3AF] dark:text-slate-400">{label}</p>
      <p className="text-sm font-bold text-[#111827] dark:text-slate-100">{value}</p>
    </div>
  );
};

const safeText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : "—";
};

const BusinessDivisionDetailsSheet = ({
  open,
  onOpenChange,
  divisionId,
  onEditDivision,
}: Props) => {
  const { data: detailRes, isLoading } = useQuery({
    queryKey: ["businessDivisions", "detail", divisionId],
    queryFn: async () => await businessDivisionApi.getDivisionById(String(divisionId)),
    enabled: open && Boolean(divisionId),
  });

  const division: BusinessDivision | undefined = detailRes?.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[720px] w-full rounded-2xl overflow-hidden p-0 [&>button.absolute]:hidden"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-[#E5E7EB] dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 font-quicksand"
                >
                  <ArrowLeft className="h-5 w-5 text-[#6B7280] dark:text-slate-400" />
                  <SheetTitle className="text-base font-semibold text-[#2A4467] dark:text-slate-100">
                    Business Division Details
                  </SheetTitle>
                </button>
              </SheetClose>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-lg"
                >
                  <X className="h-5 w-5 text-[#EF4444]" />
                </button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100 font-quicksand">
                {isLoading ? "—" : safeText(division?.name)}
              </p>
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-lg border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#6B6B6B] font-quicksand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                type="button"
              >
                <img
                  src="/assets/business-divisions/icon-export.svg"
                  alt=""
                  className="h-4 w-4"
                />
                Export
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-x-16 gap-y-8">
              <InfoItem
                label="Division Name"
                value={isLoading ? "—" : safeText(division?.name)}
              />
              <InfoItem
                label="Location"
                value={isLoading ? "—" : safeText(division?.location)}
              />
              <InfoItem
                label="Total Contracts"
                value={isLoading ? "—" : safeText(division?.totalContracts ?? 0)}
              />
              <InfoItem
                label="Total Contract Value"
                value={
                  isLoading ? "—" : formatCompactCurrency(division?.totalContractValue)
                }
              />
              <InfoItem
                label="Total Projects"
                value={isLoading ? "—" : safeText(division?.totalProjects ?? 0)}
              />
              <InfoItem
                label="Total Project Value"
                value={
                  isLoading ? "—" : formatCompactCurrency(division?.totalProjectValue)
                }
              />
              <div className="col-span-2">
                <InfoItem
                  label="Date Created"
                  value={isLoading ? "—" : "—"}
                />
              </div>
            </div>

            <div className="mt-auto">
              <Button
                type="button"
                className="h-[52px] w-full rounded-xl bg-[#F3F4F6] text-base font-semibold text-[#111827] font-quicksand hover:bg-[#E5E7EB] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                disabled={isLoading || !division}
                onClick={() => {
                  if (!division) return;
                  onOpenChange(false);
                  onEditDivision?.(division);
                }}
              >
                Edit Business Division
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessDivisionDetailsSheet;
