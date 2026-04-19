import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";
import EmployeeCardPopover from "../components/EmployeeCardPopover";
import type { ContractDetail } from "@/types";
import { cn, formatDateTZ } from "@/lib/utils";
import EditContract from "../components/EditContract";
import { useToastHandler } from "@/hooks/useToaster";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { differenceInDays, parseISO } from "date-fns";
import { LabelItem } from "../components/LabelItem";

/**
 * Conditional Rendering Matrix
 *
 * | Element               | Vendor | Contract Manager | Approver | View Only | Company Admin |
 * |-----------------------|--------|------------------|----------|-----------|---------------|
 * | Export Report Button  | ✅     | ✅               | ❌       | ❌        | ✅            |
 * | Edit Contract Button  | ❌     | ✅               | ❌       | ❌        | ❌            |
 * | Project Name          | ❌     | ✅               | ❌       | ✅        | ❌            |
 * | Deviation Scale       | ✅     | ❌               | ✅       | ❌        | ✅            |
 * | Business Division     | ✅     | ❌               | ✅       | ❌        | ✅            |
 * | Contract Type         | ✅     | ❌               | ✅       | ❌        | ✅            |
 * | Durations (Draft etc) | ✅     | ❌               | ✅       | ❌        | ✅            |
 * | Internal Stakeholder  | ✅     | ✅               | ✅       | ✅        | ✅            |
 * | Approve/Reject Btns   | ❌     | ❌               | ✅       | ❌        | ❌            |
 * | View Layout           | 3-Col  | 2-Col            | 3-Col    | 2-Col     | 3-Col         |
 */

type ViewProps = {
  contract: ContractDetail;
  status: { label: string; className: string };
  projectName: string;
  vendorName: string;
  contractManager: ContractDetail["creator"];
  internalTeam: NonNullable<ContractDetail["internalTeam"]>;
  vendorPersonnel: NonNullable<ContractDetail["vendorPersonnel"]>;
  relationshipLabel: string;
  effectiveDate: string;
  publishedDate: string;
  endDate: string;
  draftDuration: string;
  reviewDuration: string;
  approvalDuration: string;
  executionDuration: string;
};

const ManagerView: React.FC<ViewProps> = ({
  contract,
  status,
  projectName,
  effectiveDate,
  publishedDate,
  relationshipLabel,
  endDate,
  contractManager,
  vendorName,
  internalTeam,
  vendorPersonnel,
}) => (
  <>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <span className="text-slate-500">Contract Name</span>
          <span className="text-slate-900 font-medium">
            {contract.title || "N/A"}
          </span>
          <span className="text-slate-500">Project Name</span>
          <span className="text-slate-900">{projectName || "N/A"}</span>
          <span className="text-slate-500">Effective Date</span>
          <span className="text-slate-900">{effectiveDate}</span>
          <span className="text-slate-500">Published Date</span>
          <span className="text-slate-900">{publishedDate}</span>
        </div>
        <div className="space-y-2 grid grid-cols-2 gap-3">
          <span className="text-slate-500">Status</span>
          <Badge className={cn("w-fit", status.className)}>
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <span className="text-slate-500">Contract ID</span>
          <span className="text-slate-900">
            {contract.contractId || contract._id || "N/A"}
          </span>
          <span className="text-slate-500">Project Relationship</span>
          <span className="text-slate-900">{relationshipLabel}</span>
          <span className="text-slate-500">End Date</span>
          <span className="text-slate-900">{endDate}</span>
          <span className="text-slate-500">Contract Manager</span>
          {contractManager ? (
            <EmployeeCardPopover
              triggerLabel={contractManager.name || "N/A"}
              name={contractManager.name || "N/A"}
              email={contractManager.email || "N/A"}
              role={contractManager.role || "N/A"}
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <span className="text-slate-500">Description</span>
      <p className="text-slate-700 max-w-3xl">
        {contract.description || "N/A"}
      </p>
    </div>

    <div className="space-y-4">
      <div className="text-base font-semibold text-gray-600">Contract Team</div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <span className="text-slate-500 block">Contract Manager</span>
          {contractManager ? (
            <EmployeeCardPopover
              triggerLabel={contractManager.name}
              name={contractManager.name}
              email={contractManager.email || "N/A"}
              role={contractManager.role || "N/A"}
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
          <span className="text-slate-500 block mt-5">
            Internal Stakeholder
          </span>
          <div className="flex flex-col gap-1">
            {internalTeam.length > 0 ? (
              internalTeam.map((member) => (
                <EmployeeCardPopover
                  key={member.id}
                  triggerLabel={member.name}
                  name={member.name}
                  email={member.email || "N/A"}
                  role={member.role || "N/A"}
                  phone="N/A"
                />
              ))
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-500 block">Vendor/Contractor</span>
          {vendorName ? (
            <EmployeeCardPopover
              triggerLabel={vendorName}
              name={vendorName}
              email="N/A"
              role="N/A"
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
          <span className="text-slate-500 block mt-5">
            Vendor/Contractor Key Personnel
          </span>
          <div className="flex flex-col gap-1">
            {vendorPersonnel.length > 0 ? (
              vendorPersonnel.map((person) => (
                <EmployeeCardPopover
                  key={person._id}
                  triggerLabel={person.name}
                  name={person.name}
                  email={person.email || "N/A"}
                  role={person.role || "N/A"}
                  phone={person.phone || "N/A"}
                />
              ))
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

const VendorView: React.FC<ViewProps> = ({
  contract,
  status,
  effectiveDate,
  publishedDate,
  relationshipLabel,
  endDate,
  contractManager,
  draftDuration,
  reviewDuration,
  approvalDuration,
  executionDuration,
  vendorName,
  vendorPersonnel,
  internalTeam,
}) => (
  <>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Column 1 */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Contract Name</span>
          <span className="text-slate-900 font-medium">
            {contract.title || "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Deviation Scale</span>
          {/* <span className="text-slate-900">
            {contract.deviationScale ?? "N/A"}
          </span> */}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Published Date</span>
          <span className="text-slate-900">{publishedDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Draft Duration</span>
          <span className="text-slate-900">{draftDuration}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Execution Duration</span>
          <span className="text-slate-900">{executionDuration}</span>
        </div>
      </div>

      {/* Column 2 */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Contract ID</span>
          <span className="text-slate-900">
            {contract.contractId || contract._id || "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Contract Type</span>
          <span className="text-slate-900">
            {typeof contract.contractType === "string"
              ? contract.contractType
              : contract.contractType?.name || "Fixed Price"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Effective Date</span>
          <span className="text-slate-900">{effectiveDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Review Duration</span>
          <span className="text-slate-900">{reviewDuration}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Contract Manager</span>
          {contractManager ? (
            <EmployeeCardPopover
              triggerLabel={contractManager.name}
              name={contractManager.name}
              email={contractManager.email || "N/A"}
              role={contractManager.role || "N/A"}
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
        </div>
      </div>

      {/* Column 3 */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Contract Relationship</span>
          <span className="text-slate-900">{relationshipLabel}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Business Division</span>
          <span className="text-slate-900">
            {contract.businessDivision?.name || "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">End Date</span>
          <span className="text-slate-900">{endDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Approval Duration</span>
          <span className="text-slate-900">{approvalDuration}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500">Status</span>
          <Badge className={cn("w-fit", status.className)}>
            {status.label}
          </Badge>
        </div>
      </div>
    </div>

    <div className="space-y-2 pt-4">
      <span className="text-slate-500">Description</span>
      <p className="text-slate-700 max-w-3xl">
        {contract.description || "N/A"}
      </p>
    </div>

    <div className="space-y-4 pt-4">
      <div className="text-base font-semibold text-gray-600">Contract Team</div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <span className="text-slate-500 block">Contract Manager</span>
          {contractManager ? (
            <EmployeeCardPopover
              triggerLabel={contractManager.name}
              name={contractManager.name}
              email={contractManager.email || "N/A"}
              role={contractManager.role || "N/A"}
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
          <span className="text-slate-500 block mt-5">
            Internal Stakeholder
          </span>
          <div className="flex flex-col gap-1">
            {internalTeam.length > 0 ? (
              internalTeam.map((member) => (
                <EmployeeCardPopover
                  key={member.id}
                  triggerLabel={member.name}
                  name={member.name}
                  email={member.email || "N/A"}
                  role={member.role || "N/A"}
                  phone="N/A"
                />
              ))
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-500 block">Vendor/Contractor</span>
          {vendorName ? (
            <EmployeeCardPopover
              triggerLabel={vendorName}
              name={vendorName}
              email="N/A"
              role="N/A"
              phone="N/A"
            />
          ) : (
            <span className="text-slate-900">N/A</span>
          )}
          <span className="text-slate-500 block mt-5">
            Vendor/Contractor Key Personnel
          </span>
          <div className="flex flex-col gap-1">
            {vendorPersonnel.length > 0 ? (
              vendorPersonnel.map((person) => (
                <EmployeeCardPopover
                  key={person._id}
                  triggerLabel={person.name}
                  name={person.name}
                  email={person.email || "N/A"}
                  role={person.role || "N/A"}
                  phone={person.phone || "N/A"}
                />
              ))
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

const ApproverView: React.FC<ViewProps> = ({
  contract,
  status,
  projectName,
  effectiveDate,
  publishedDate,
  relationshipLabel,
  endDate,
  contractManager,
  draftDuration,
  reviewDuration,
  approvalDuration,
  executionDuration,
  vendorName,
  vendorPersonnel,
  internalTeam,
}) => {
  const rel = contract.contractRelationship as string | undefined;
  const linkedProject = projectName || "N/A";
  const linkedMsa =
    typeof (contract as any).msaContract === "string"
      ? (contract as any).msaContract
      : (contract as any).msaContract?.title || "N/A";
  const msaCategory = (contract as any).msaCategory || "N/A";
  const awarded =
    (contract as any).solicitation || (contract as any).solicitationId || "-";

  if (rel === "project") {
    return (
      <>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <LabelItem label="Contract Name" value={contract.title || "N/A"} />
            <LabelItem label="Linked Project" value={linkedProject} />
            <LabelItem
              label="Business Division"
              value={contract.businessDivision?.name || "N/A"}
            />
            <LabelItem label="End Date" value={endDate} />

            <LabelItem label="Approval Duration" value={approvalDuration} />
          </div>

          <div className="space-y-4">
            <LabelItem
              label="Contract ID"
              value={contract.contractId || contract._id || "N/A"}
            />
            <LabelItem
              label="Deviation Scale"
              // value={contract.deviationScale ?? "N/A"}
            />
            <LabelItem label="Published Date" value={publishedDate} />
            <LabelItem label="Draft Duration" value={draftDuration} />
            <LabelItem label="Execution Duration" value={executionDuration} />
          </div>

          <div className="space-y-4">
            <LabelItem
              label="Contract Relationship"
              value={relationshipLabel}
            />
            <LabelItem
              label="Contract Type"
              value={
                typeof contract.contractType === "string"
                  ? contract.contractType
                  : contract.contractType?.name || "Fixed Price"
              }
            />

            <LabelItem label="Effective Date" value={effectiveDate} />
            <LabelItem label="Review Duration" value={reviewDuration} />
            <LabelItem
              label="Contract Manager"
              value={
                contractManager ? (
                  <EmployeeCardPopover
                    triggerLabel={contractManager.name}
                    name={contractManager.name}
                    email={contractManager.email || "N/A"}
                    role={contractManager.role || "N/A"}
                    phone="N/A"
                  />
                ) : (
                  <span className="text-slate-900">N/A</span>
                )
              }
            />
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <span className="text-slate-500 block">Status</span>
          <Badge className={cn("w-fit", status.className)}>
            {status.label}
          </Badge>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-slate-500">Description</span>
          <p className="text-slate-700 max-w-3xl">
            {contract.description || "N/A"}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="text-base font-semibold text-gray-600">
            Contract Team
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-slate-500 block">Contract Manager</span>
              {contractManager ? (
                <EmployeeCardPopover
                  triggerLabel={contractManager.name}
                  name={contractManager.name}
                  email={contractManager.email || "N/A"}
                  role={contractManager.role || "N/A"}
                  phone="N/A"
                />
              ) : (
                <span className="text-slate-900">N/A</span>
              )}
              <span className="text-slate-500 block mt-5">
                Internal Stakeholder
              </span>
              <div className="flex flex-col gap-1">
                {internalTeam.length > 0 ? (
                  internalTeam.map((member) => (
                    <EmployeeCardPopover
                      key={member.id}
                      triggerLabel={member.name}
                      name={member.name}
                      email={member.email || "N/A"}
                      role={member.role || "N/A"}
                      phone="N/A"
                    />
                  ))
                ) : (
                  <span className="text-slate-900">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-500 block">Vendor/Contractor</span>
              {vendorName ? (
                <EmployeeCardPopover
                  triggerLabel={vendorName}
                  name={vendorName}
                  email="N/A"
                  role="N/A"
                  phone="N/A"
                />
              ) : (
                <span className="text-slate-900">N/A</span>
              )}
              <span className="text-slate-500 block mt-5">
                Vendor/Contractor Key Personnel
              </span>
              <div className="flex flex-col gap-1">
                {vendorPersonnel.length > 0 ? (
                  vendorPersonnel.map((person) => (
                    <EmployeeCardPopover
                      key={person._id}
                      triggerLabel={person.name}
                      name={person.name}
                      email={person.email || "N/A"}
                      role={person.role || "N/A"}
                      phone={person.phone || "N/A"}
                    />
                  ))
                ) : (
                  <span className="text-slate-900">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract Name</span>
            <span className="text-slate-900 font-medium">
              {contract.title || "N/A"}
            </span>
          </div>
          {rel === "project" && (
            <LabelItem label="Linked Project" value={linkedProject} />
          )}
          {(rel === "msa" || rel === "msa_project") && (
            <>
              <LabelItem label="Linked MSA" value={linkedMsa} />
              <LabelItem label="MSA Category" value={msaCategory} />
              <LabelItem label="Awarded Solicitation" value={awarded || "-"} />
            </>
          )}
          <LabelItem
            label="Deviation Scale"
            // value={contract.deviationScale ?? "N/A"}
          />
          <LabelItem label="Published Date" value={publishedDate} />
          <LabelItem label="Draft Duration" value={draftDuration} />
          <LabelItem label="Execution Duration" value={executionDuration} />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract ID</span>
            <span className="text-slate-900">
              {contract.contractId || contract._id || "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract Type</span>
            <span className="text-slate-900">
              {typeof contract.contractType === "string"
                ? contract.contractType
                : contract.contractType?.name || "Fixed Price"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Effective Date</span>
            <span className="text-slate-900">{effectiveDate}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Review Duration</span>
            <span className="text-slate-900">{reviewDuration}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract Manager</span>
            {contractManager ? (
              <EmployeeCardPopover
                triggerLabel={contractManager.name}
                name={contractManager.name}
                email={contractManager.email || "N/A"}
                role={contractManager.role || "N/A"}
                phone="N/A"
              />
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract Relationship</span>
            <span className="text-slate-900">{relationshipLabel}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Business Division</span>
            <span className="text-slate-900">
              {contract?.businessDivision?.name || "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">End Date</span>
            <span className="text-slate-900">{endDate}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Approval Duration</span>
            <span className="text-slate-900">{approvalDuration}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Status</span>
            <Badge className={cn("w-fit", status.className)}>
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <span className="text-slate-500">Description</span>
        <p className="text-slate-700 max-w-3xl">
          {contract.description || "N/A"}
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <div className="text-base font-semibold text-gray-600">
          Contract Team
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-slate-500 block">Contract Manager</span>
            {contractManager ? (
              <EmployeeCardPopover
                triggerLabel={contractManager.name}
                name={contractManager.name}
                email={contractManager.email || "N/A"}
                role={contractManager.role || "N/A"}
                phone="N/A"
              />
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
            <span className="text-slate-500 block mt-5">
              Internal Stakeholder
            </span>
            <div className="flex flex-col gap-1">
              {internalTeam.length > 0 ? (
                internalTeam.map((member) => (
                  <EmployeeCardPopover
                    key={member.id}
                    triggerLabel={member.name}
                    name={member.name}
                    email={member.email || "N/A"}
                    role={member.role || "N/A"}
                    phone="N/A"
                  />
                ))
              ) : (
                <span className="text-slate-900">N/A</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-slate-500 block">Vendor/Contractor</span>
            {vendorName ? (
              <EmployeeCardPopover
                triggerLabel={vendorName}
                name={vendorName}
                email="N/A"
                role="N/A"
                phone="N/A"
              />
            ) : (
              <span className="text-slate-900">N/A</span>
            )}
            <span className="text-slate-500 block mt-5">
              Vendor/Contractor Key Personnel
            </span>
            <div className="flex flex-col gap-1">
              {vendorPersonnel.length > 0 ? (
                vendorPersonnel.map((person) => (
                  <EmployeeCardPopover
                    key={person._id}
                    triggerLabel={person.name}
                    name={person.name}
                    email={person.email || "N/A"}
                    role={person.role || "N/A"}
                    phone={person.phone || "N/A"}
                  />
                ))
              ) : (
                <span className="text-slate-900">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

type Props = {
  contract: ContractDetail;
  status: { label: string; className: string };
};

const OverviewTab: React.FC<Props> = ({ contract, status }) => {
  const [editingContractId, setEditingContractId] = React.useState<
    string | null
  >(null);

  const qc = useQueryClient();
  const { success } = useToastHandler();
  const { isVendor, isProjectManager, isApprover, isViewOnly, isCompanyAdmin } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  const projectName =
    typeof contract.project === "string"
      ? contract.project
      : contract.project?.name || "";
  const vendorName =
    typeof contract.vendor === "string"
      ? contract.vendor
      : contract.vendor?.name || "";
  const contractManager = contract.creator;
  const internalTeam = contract.internalTeam ?? [];
  const vendorPersonnel = contract.vendorPersonnel ?? [];
  const relationshipLabel =
    contract.contractRelationship === "standalone"
      ? "Stand-Alone Project"
      : contract.contractRelationship === "project"
        ? "Link to Project"
        : contract.contractRelationship === "msa_project"
          ? "Link to MSA"
          : (contract as any).contractRelationship === "msa"
            ? "Link to MSA"
            : "N/A";
  const effectiveDate = formatDateTZ(
    contract.startDate,
    "dd MMM yyyy",
    contract.timezone,
  );
  const publishedDate = formatDateTZ(
    contract.createdAt,
    "dd MMM yyyy",
    contract.timezone,
  );
  const endDate = formatDateTZ(
    contract.endDate,
    "dd MMM yyyy",
    contract.timezone,
  );

  const getDuration = (start?: string | Date, end?: string | Date) => {
    if (!start || !end) return "N/A";
    const s = typeof start === "string" ? parseISO(start) : start;
    const e = typeof end === "string" ? parseISO(end) : end;
    const days = differenceInDays(e, s);
    return `${Math.max(0, days)} days`;
  };

  const draftDuration = getDuration(
    contract.contractFormationStage?.draft?.startDate,
    contract.contractFormationStage?.draft?.endDate,
  );
  const reviewDuration = getDuration(
    contract.contractFormationStage?.review?.startDate,
    contract.contractFormationStage?.review?.endDate,
  );
  const approvalDuration = getDuration(
    contract.contractFormationStage?.approval?.startDate,
    contract.contractFormationStage?.approval?.endDate,
  );
  const executionDuration = getDuration(
    contract.contractFormationStage?.execution?.startDate,
    contract.contractFormationStage?.execution?.endDate,
  );

  const viewProps: ViewProps = {
    contract,
    status,
    projectName,
    vendorName,
    contractManager,
    internalTeam,
    vendorPersonnel,
    relationshipLabel,
    effectiveDate,
    publishedDate,
    endDate,
    draftDuration,
    reviewDuration,
    approvalDuration,
    executionDuration,
  };

  const renderView = () => {
    if (isContractVendorLike) return <VendorView {...viewProps} />;
    if (isApprover) return <ApproverView {...viewProps} />;
    if (isCompanyAdmin) return <VendorView {...viewProps} />;
    if (isViewOnly) return <ManagerView {...viewProps} />;
    return <ManagerView {...viewProps} />;
  };

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-gray-600">
          Contract Details
        </div>
        <div className="flex items-center gap-2">
          {(!isViewOnly && isApprover) || (!isApprover && !isViewOnly) ? (
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          ) : null}

          {!isContractVendorLike && !isApprover && !isViewOnly && !isCompanyAdmin && (
            <Button
              onClick={() => setEditingContractId(contract?._id ?? null)}
              disabled={contract?.status === "publish"}
            >
              Edit Contract
            </Button>
          )}
        </div>
      </div>

      {renderView()}

      {editingContractId !== null && (
        <EditContract
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingContractId(null);
          }}
          contractId={editingContractId}
          onUpdated={() => {
            success("Contract updated successfully", "Changes saved");
            qc.invalidateQueries({ queryKey: ["contract-manager-contracts"] });
            setEditingContractId(null);
          }}
        />
      )}
    </TabsContent>
  );
};

export default OverviewTab;
