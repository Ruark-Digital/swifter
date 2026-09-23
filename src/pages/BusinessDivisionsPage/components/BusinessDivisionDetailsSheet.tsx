import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn, formatDateTZ } from "@/lib/utils";
import {
  ContractStatusBadge,
  type Status as ContractStatus,
} from "@/pages/ContractManagementPage/components/StatusBadge";
import {
  businessDivisionApi,
  type BusinessDivision,
  type BusinessDivisionContract,
  type BusinessDivisionPage,
  type BusinessDivisionProject,
} from "../api/businessDivisionApi";

const TAB_PAGE_SIZE = 10;

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

/** Project status pill — mirrors the colours the Project Management table uses
 *  (active → green, completed → blue, pending → yellow, cancelled → red) so a
 *  project's status reads identically wherever it appears. */
const ProjectStatusPill = ({ status }: { status?: string }) => {
  const label = String(status ?? "").trim();
  if (!label) return <span className="text-sm text-[#9CA3AF] dark:text-slate-400">—</span>;

  const key = label.toLowerCase();
  const tone =
    key === "active"
      ? "bg-green-100 text-green-700"
      : key === "completed"
        ? "bg-blue-100 text-blue-700"
        : key === "pending"
          ? "bg-yellow-100 text-yellow-700"
          : key === "cancelled" || key === "terminated"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize font-quicksand",
        tone,
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
};

/** Normalises a tab's list field: the API now sends `{ docs, totalDocs, ... }`,
 *  older payloads sent a plain array. */
const toPage = <T,>(value?: BusinessDivisionPage<T> | T[]) => {
  if (Array.isArray(value)) {
    return { docs: value, totalDocs: value.length, page: 1, totalPages: 1 };
  }
  const docs = value?.docs ?? [];
  return {
    docs,
    totalDocs: value?.totalDocs ?? docs.length,
    page: value?.page ?? 1,
    totalPages: Math.max(value?.totalPages ?? 1, 1),
  };
};

/** Search box shown above each tab's list. */
const TabSearch = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="mb-3 flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 font-quicksand dark:border-slate-700">
    <Search className="h-4 w-4 shrink-0 text-[#6B6B6B] dark:text-slate-400" strokeWidth={1.67} />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
    />
  </div>
);

/** Prev / next controls under a tab's list; hidden when there's one page. */
const TabPager = ({
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between font-quicksand">
      <p className="text-xs text-[#6B7280] dark:text-slate-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/** Scroll container shared by both tabs — handles loading / empty / list. */
const TabListShell = ({
  isLoading,
  count,
  emptyLabel,
  children,
}: {
  isLoading: boolean;
  count: number;
  emptyLabel: string;
  children: ReactNode;
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-slate-700">
      {isLoading ? (
        <div className="p-4 text-sm text-[#9CA3AF] dark:text-slate-400">Loading…</div>
      ) : count === 0 ? (
        <div className="p-6 text-center text-sm text-[#9CA3AF] dark:text-slate-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="max-h-[22rem] divide-y divide-[#F3F4F6] overflow-y-auto dark:divide-slate-800">
          {children}
        </div>
      )}
    </div>
  );
};

/** Count chip shown inside a tab trigger. */
const CountChip = ({ isLoading, count }: { isLoading: boolean; count: number }) => (
  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5E7EB] px-1.5 text-xs font-bold text-[#374151] dark:bg-slate-700 dark:text-slate-200">
    {isLoading ? "—" : count}
  </span>
);

const ProjectRow = ({ project }: { project: BusinessDivisionProject }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3 font-quicksand">
    <div className="flex min-w-0 flex-col">
      <p className="truncate text-sm font-semibold text-[#111827] dark:text-slate-100">
        {safeText(project.name ?? project.title)}
      </p>
      <p className="truncate text-xs text-[#6B7280] dark:text-slate-400">
        {safeText(project.projectId)}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <p className="text-sm font-bold text-[#111827] dark:text-slate-100">
        {formatCompactCurrency(project.budget)}
      </p>
      <ProjectStatusPill status={project.status} />
    </div>
  </div>
);

const ContractRow = ({
  contract,
  onNavigate,
}: {
  contract: BusinessDivisionContract;
  onNavigate: () => void;
}) => {
  const inner = (
    <>
      <div className="flex min-w-0 flex-col">
        <p
          className={cn(
            "truncate text-sm font-semibold text-[#111827] dark:text-slate-100",
            contract._id &&
              "group-hover:text-[#2A4467] group-hover:underline dark:group-hover:text-blue-300",
          )}
        >
          {safeText(contract.title)}
        </p>
        <p className="truncate text-xs text-[#6B7280] dark:text-slate-400">
          {safeText(contract.contractId)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-sm font-bold text-[#111827] dark:text-slate-100">
          {formatCompactCurrency(contract.contractValue ?? 0)}
        </p>
        <ContractStatusBadge status={contract.status as ContractStatus | undefined} />
        {contract._id && (
          <ChevronRight className="h-4 w-4 text-[#9CA3AF] dark:text-slate-500" />
        )}
      </div>
    </>
  );

  // Only linkable when we have the contract's id to route to.
  if (!contract._id) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3 font-quicksand">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/dashboard/contract-management/${contract._id}`}
      onClick={onNavigate}
      className="group flex items-center justify-between gap-4 px-4 py-3 font-quicksand transition-colors hover:bg-[#F9FAFB] focus:bg-[#F9FAFB] focus:outline-none dark:hover:bg-slate-800/60 dark:focus:bg-slate-800/60"
    >
      {inner}
    </Link>
  );
};

const BusinessDivisionDetailsSheet = ({
  open,
  onOpenChange,
  divisionId,
  onEditDivision,
}: Props) => {
  const [projectSearch, setProjectSearch] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);
  const [debouncedProjectSearch] = useDebounceValue(projectSearch.trim(), 300);
  const [debouncedContractSearch] = useDebounceValue(contractSearch.trim(), 300);

  // Start each division on a clean slate.
  useEffect(() => {
    setProjectSearch("");
    setContractSearch("");
    setProjectPage(1);
    setContractPage(1);
  }, [divisionId]);

  // A new search term always starts from the first page.
  useEffect(() => setProjectPage(1), [debouncedProjectSearch]);
  useEffect(() => setContractPage(1), [debouncedContractSearch]);

  const detailQuery = {
    projectQuery: debouncedProjectSearch || undefined,
    projectPage,
    projectLimit: TAB_PAGE_SIZE,
    contractQuery: debouncedContractSearch || undefined,
    contractPage,
    contractLimit: TAB_PAGE_SIZE,
  };

  const { data: detailRes, isLoading, isFetching } = useQuery({
    queryKey: ["businessDivisions", "detail", divisionId, detailQuery],
    queryFn: async () =>
      await businessDivisionApi.getDivisionById(String(divisionId), detailQuery),
    enabled: open && Boolean(divisionId),
    // Keep the current rows on screen while the next page / search loads.
    placeholderData: keepPreviousData,
  });

  const division: BusinessDivision | undefined = detailRes?.data;
  const projects = toPage(division?.projects);
  const contracts = toPage(division?.contracts);

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

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100 font-quicksand">
                  {isLoading ? "—" : safeText(division?.name)}
                </p>
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
                  label="Total Project Budget"
                  value={
                    isLoading ? "—" : formatCompactCurrency(division?.totalProjectValue)
                  }
                />
                <div className="col-span-2">
                  <InfoItem
                    label="Date Created"
                    value={
                      isLoading
                        ? "—"
                        : division?.createdAt
                          ? formatDateTZ(division.createdAt, "MMM dd, yyyy")
                          : "—"
                    }
                  />
                </div>
              </div>

              <Tabs defaultValue="projects" className="gap-4 font-quicksand">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="projects" className="gap-2">
                    Projects
                    <CountChip isLoading={isLoading} count={projects.totalDocs} />
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="gap-2">
                    Contracts
                    <CountChip isLoading={isLoading} count={contracts.totalDocs} />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="projects">
                  <TabSearch
                    value={projectSearch}
                    onChange={setProjectSearch}
                    placeholder="Search projects by name"
                  />
                  <TabListShell
                    isLoading={isLoading}
                    count={projects.docs.length}
                    emptyLabel={
                      debouncedProjectSearch
                        ? "No projects match your search."
                        : "No projects linked to this division yet."
                    }
                  >
                    {projects.docs.map((project) => (
                      <ProjectRow key={project._id} project={project} />
                    ))}
                  </TabListShell>
                  <TabPager
                    page={projects.page}
                    totalPages={projects.totalPages}
                    disabled={isFetching}
                    onPageChange={setProjectPage}
                  />
                </TabsContent>

                <TabsContent value="contracts">
                  <TabSearch
                    value={contractSearch}
                    onChange={setContractSearch}
                    placeholder="Search contracts by title or ID"
                  />
                  <TabListShell
                    isLoading={isLoading}
                    count={contracts.docs.length}
                    emptyLabel={
                      debouncedContractSearch
                        ? "No contracts match your search."
                        : "No contracts linked to this division yet."
                    }
                  >
                    {contracts.docs.map((contract) => (
                      <ContractRow
                        key={contract._id}
                        contract={contract}
                        onNavigate={() => onOpenChange(false)}
                      />
                    ))}
                  </TabListShell>
                  <TabPager
                    page={contracts.page}
                    totalPages={contracts.totalPages}
                    disabled={isFetching}
                    onPageChange={setContractPage}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Edit is an admin-only action; read-only viewers (e.g. CMs) are
                not given an `onEditDivision` handler, so the footer is hidden. */}
            {onEditDivision && (
              <div className="border-t border-[#E5E7EB] p-6 dark:border-slate-700">
                <Button
                  type="button"
                  className="h-[52px] w-full rounded-xl bg-[#F3F4F6] text-base font-semibold text-[#111827] font-quicksand hover:bg-[#E5E7EB] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  disabled={isLoading || !division}
                  onClick={() => {
                    if (!division) return;
                    onOpenChange(false);
                    onEditDivision(division);
                  }}
                >
                  Edit Business Division
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessDivisionDetailsSheet;
