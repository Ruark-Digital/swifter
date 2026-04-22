import React from "react";
import { useWatch, Control } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type Props = { control: Control<any> };

const Step9ReviewPublish: React.FC<Props> = ({ control }) => {
  const name = useWatch({ control, name: "name" });
  const type = useWatch({ control, name: "type" });
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
  const documents = useWatch({ control, name: "documents" }) as File[] | undefined;
  const approvalGroups = useWatch({ control, name: "approvalGroups" }) as
    | { name?: string | null; approvers?: unknown; approvalLevel?: string }[]
    | undefined;

  const formatDate = (value?: Date | null) => {
    if (!value) return "Not specified";
    return value.toLocaleDateString();
  };

  const formatAmount = (value: unknown) => {
    if (value == null || value === "") return "Not specified";
    if (typeof value === "number") return value.toLocaleString();
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
      <p className="text-sm font-semibold text-slate-900">Contract Summary</p>

      <Accordion type="single" collapsible defaultValue="1" className="w-full space-y-3">
        <AccordionItem value="1" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">1. Basic Information</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Contract Name</p>
                  <p className="text-slate-800">{name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Contract Type</p>
                  <p className="text-slate-800">{type || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Complexity Rating</p>
                  <p className="text-slate-800">{rating || "Not specified"}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Description</p>
                <p className="text-slate-700 mt-1">
                  {description || "No description provided"}
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full mt-4">
                Edit Details
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="2" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">2. Contract Team</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasTeamInfo ? (
                <>
                  <div>
                    <p className="text-slate-500">Contract Manager</p>
                    <p className="text-slate-800">{manager || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vendor</p>
                    <p className="text-slate-800">{vendor || "Not specified"}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No team members added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="3" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">3. Contract Value &amp; Payments</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Total Contract Value</p>
                  <p className="text-slate-800">{formatAmount(contractValue)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment Structure</p>
                  <p className="text-slate-800">{paymentStructure || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment Term</p>
                  <p className="text-slate-800">{paymentTerm || "Not specified"}</p>
                </div>
              </div>
              {hasMilestones ? (
                <div className="space-y-2">
                  <p className="text-slate-500">Milestones</p>
                  <div className="space-y-1">
                    {milestones?.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{m.name || `Milestone ${idx + 1}`}</span>
                        <span className="text-slate-500">{formatAmount(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No milestones added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="4" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">4. Timeline</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 text-sm">
              {hasTimeline ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500">Effective Date</p>
                    <p className="text-slate-800">{formatDate(effectiveDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">End Date</p>
                    <p className="text-slate-800">{formatDate(endDate)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No timeline set</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="5" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">5. Deliverables</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasDeliverables ? (
                <ul className="list-disc list-inside space-y-1">
                  {deliverables?.map((d, idx) => (
                    <li key={idx} className="text-slate-800">
                      {d.name || `Deliverable ${idx + 1}`} – {formatDate(d.dueDate ?? undefined)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No deliverables added</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="6" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">6. Configure Approval Level</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasApprovalGroups ? (
                <div className="space-y-2">
                  {approvalGroups?.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-700 font-medium">{g.name || `Group ${idx + 1}`}</p>
                        <p className="text-slate-500 text-xs">Approval Level {g.approvalLevel || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No approval groups configured</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="7" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-[15px] leading-6 hover:no-underline">
            <span className="font-medium">7. Documents</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm">
              {hasDocuments ? (
                <>
                  <p className="text-slate-500 mb-2">Uploaded Documents ({documents?.length})</p>
                  <ul className="list-disc list-inside space-y-1">
                    {documents?.map((file, idx) => (
                      <li key={idx} className="text-slate-800">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-slate-500">No documents uploaded</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Step9ReviewPublish;
