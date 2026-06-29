import React from "react";
import { useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getRequest } from "@/lib/axiosInstance";
import { useUser } from "@/store/authSlice";

type Props = { control: any };

function extractList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray((value as any)?.docs)) return (value as any).docs as T[];
  if (Array.isArray((value as any)?.data)) return (value as any).data as T[];
  if (Array.isArray((value as any)?.vendors))
    return (value as any).vendors as T[];
  return [];
}

const Step8ReviewPublish: React.FC<Props> = ({ control }) => {
  const currentUser = useUser();
  const name = useWatch({ control, name: "name" });
  const type = useWatch({ control, name: "type" });
  const category = useWatch({ control, name: "category" });
  const description = useWatch({ control, name: "description" });
  const rating = useWatch({ control, name: "rating" });

  const manager = useWatch({ control, name: "manager" });
  const vendor = useWatch({ control, name: "vendor" });
  const contractValue = useWatch({ control, name: "contractValue" });
  const paymentStructure = useWatch({ control, name: "paymentStructure" });
  const paymentTerm = useWatch({ control, name: "paymentTerm" });
  const milestones = useWatch({ control, name: "milestones" }) as
    | { name?: string | null; amount?: unknown; dueDate?: Date | null }[]
    | undefined;
  const effectiveDate = useWatch({ control, name: "effectiveDate" }) as
    | Date
    | undefined;
  const endDate = useWatch({ control, name: "endDate" }) as Date | undefined;
  const deliverables = useWatch({ control, name: "deliverables" }) as
    | { name?: string | null; dueDate?: Date | null }[]
    | undefined;
  const documents = useWatch({ control, name: "documents" }) as
    | File[]
    | undefined;
  const approvalGroups = useWatch({ control, name: "approvalGroups" }) as
    | { name?: string | null; approvers?: unknown; approvalLevel?: string }[]
    | undefined;

  const { data: typesRes } = useQuery({
    queryKey: ["contractReview", "types"],
    queryFn: async () => await getRequest({ url: "/contract/manager/types" }),
    staleTime: 60000,
  });
  const { data: categoriesRes } = useQuery({
    queryKey: ["contractReview", "categories"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/meta/categories" }),
    staleTime: 60000,
  });
  const { data: paymentTermsRes } = useQuery({
    queryKey: ["contractReview", "paymentTerms"],
    queryFn: async () =>
      await getRequest({ url: "/contract/manager/payment-terms" }),
    staleTime: 60000,
  });
  const { data: vendorsRes } = useQuery({
    queryKey: ["contractReview", "vendors"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/solicitations/vendors" }),
    staleTime: 60000,
  });

  const resolvedType = React.useMemo(() => {
    const options = extractList<{ _id?: string; name?: string }>(
      typesRes?.data?.data,
    );
    const byId = options.find(
      (item: { _id?: string; name?: string }) => item?._id === type,
    );
    return byId?.name || type;
  }, [type, typesRes?.data?.data]);
  const resolvedCategory = React.useMemo(() => {
    const options = extractList<{ _id?: string; name?: string }>(
      categoriesRes?.data?.data,
    );
    const byId = options.find(
      (item: { _id?: string; name?: string }) => item?._id === category,
    );
    return byId?.name || category;
  }, [categoriesRes?.data?.data, category]);
  const resolvedPaymentTerm = React.useMemo(() => {
    const options = extractList<{ _id?: string; name?: string }>(
      paymentTermsRes?.data?.data,
    );
    const byId = options.find(
      (item: { _id?: string; name?: string }) => item?._id === paymentTerm,
    );
    return byId?.name || paymentTerm;
  }, [paymentTerm, paymentTermsRes?.data?.data]);
  const resolvedVendor = React.useMemo(() => {
    const options = extractList<any>(vendorsRes?.data?.data).map((item) =>
      item?.vendor ? item.vendor : item,
    ) as { _id?: string; name?: string; email?: string }[];
    const byId = options.find(
      (item: { _id?: string; name?: string; email?: string }) => {
        return item?._id === vendor || item?.email === vendor;
      },
    );
    return byId?.name || byId?.email || vendor;
  }, [vendor, vendorsRes?.data?.data]);
  const resolvedManager = manager || currentUser?.name || currentUser?.email;

  const formatDate = (value?: Date | null) => {
    if (!value) return "Not specified";
    return format(value, "dd MMM yyyy");
  };

  const formatAmount = (value: unknown) => {
    if (value == null || value === "") return "Not specified";
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numeric)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(numeric);
    }
    return String(value);
  };

  const hasTeamInfo = manager || vendor;
  const hasMilestones = milestones && milestones.length > 0;
  const hasTimeline = effectiveDate || endDate;
  const hasDeliverables = deliverables && deliverables.length > 0;
  const hasDocuments = documents && documents.length > 0;
  const hasApprovalGroups = approvalGroups && approvalGroups.length > 0;

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contract Summary</p>

      <Accordion
        type="single"
        collapsible
        defaultValue="1"
        className="w-full space-y-3"
      >
        <AccordionItem value="1" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">1. Basic Information</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Contract Name</p>
                  <p className="text-slate-800 dark:text-slate-200">{name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Contract Type</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {resolvedType || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Category</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {resolvedCategory || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Complexity Rating</p>
                  <p className="text-slate-800 dark:text-slate-200">{rating || "Not specified"}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Description</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {description || "No description provided"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Edit Details
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="2" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">2. Contract Team</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasTeamInfo ? (
                <>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Contract Manager</p>
                    <p className="text-slate-800 dark:text-slate-200">
                      {resolvedManager || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Vendor</p>
                    <p className="text-slate-800 dark:text-slate-200">
                      {resolvedVendor || "Not specified"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No team members added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="3" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">
              3. Contract Value &amp; Payments
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Total Contract Value</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {formatAmount(contractValue)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Payment Structure</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {paymentStructure || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Payment Term</p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {resolvedPaymentTerm || "Not specified"}
                  </p>
                </div>
              </div>

              {hasMilestones ? (
                <div className="space-y-2">
                  <p className="text-slate-500 dark:text-slate-400">Milestones</p>
                  <div className="space-y-1">
                    {milestones?.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <div >
                          <span className="font-medium mr-2">{idx + 1}.</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {m.name || `Milestone ${idx + 1}`}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatAmount(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No milestones added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="4" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">4. Timeline</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              {hasTimeline ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Effective Date</p>
                    <p className="text-slate-800 dark:text-slate-200">
                      {formatDate(effectiveDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">End Date</p>
                    <p className="text-slate-800 dark:text-slate-200">{formatDate(endDate)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No timeline set</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="5" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">5. Deliverables</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasDeliverables ? (
                <ul className="list-disc list-inside space-y-1">
                  {deliverables?.map((d, idx) => (
                    <li key={idx} className="text-slate-800 dark:text-slate-200">
                      {d.name || `Deliverable ${idx + 1}`} –{" "}
                      {formatDate(d.dueDate ?? undefined)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No deliverables added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="6" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">6. Configure Approval Level</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasApprovalGroups ? (
                <div className="space-y-2">
                  {approvalGroups?.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                          {g.name || `Group ${idx + 1}`}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                          Approval Level {g.approvalLevel || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No approval groups configured</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="7" className="border border-gray-200 dark:border-slate-700 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 text-slate-900 dark:text-slate-100 hover:no-underline">
            <span className="font-medium">7. Documents</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasDocuments ? (
                <>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">
                    Uploaded Documents ({documents?.length})
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {documents?.map((file, idx) => (
                      <li key={idx} className="text-slate-800 dark:text-slate-200">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No documents uploaded</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Step8ReviewPublish;
