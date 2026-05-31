import React from "react";
import EmployeeCardPopover from "@/pages/ContractManagementPage/components/EmployeeCardPopover";
import { LabelItem } from "../components/LabelItem";
import { Status, StatusBadge } from "../components/StatusBadge";

type InternalMember = string | { name?: string; email?: string; role?: string };
type VendorPerson = {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
};

type StageRange = { start?: string; end?: string };

type Props = {
  msa: {
    title?: string;
    msaContractId?: string;
    msaType?: string;
    rating?: number;
    businessDivision?: string;
    description?: string;
  };
  dates: { published?: string; effective?: string; end?: string };
  durations: {
    draft?: string;
    review?: string;
    approval?: string;
    execution?: string;
  };
  formationStages?: {
    draft?: StageRange;
    review?: StageRange;
    approval?: StageRange;
    execution?: StageRange;
  };
  status: { label?: Status; className?: string };
  contractManager?: string;
  internalTeam: InternalMember[];
  vendorPersonnel: VendorPerson[];
};

const formatStageValue = (
  duration: string | undefined,
  range: StageRange | undefined,
) => {
  const dur = duration && duration !== "N/A" ? duration : "";
  const hasRange = range?.start || range?.end;
  if (!dur && !hasRange) return "N/A";
  if (!hasRange) return dur;
  const span = `${range?.start ?? "N/A"} – ${range?.end ?? "N/A"}`;
  return dur ? `${dur} · ${span}` : span;
};

const Overview: React.FC<Props> = ({
  msa,
  dates,
  durations,
  formationStages,
  status,
  contractManager,
  internalTeam,
  vendorPersonnel,
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <LabelItem label="Contract Name" value={msa?.title || "N/A"} />
          <LabelItem label="MSA ID" value={msa?.msaContractId || "N/A"} />
          <LabelItem label="MSA Type" value={msa?.msaType || "N/A"} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <LabelItem
            label="Deviation Scale"
            value={
              typeof msa?.rating === "number" ? String(msa?.rating) : "N/A"
            }
          />
          <LabelItem
            label="Business Division"
            value={msa?.businessDivision || "N/A"}
          />
          <LabelItem label="Published Date" value={dates.published || "N/A"} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <LabelItem label="Effective Date" value={dates.effective || "N/A"} />
          <LabelItem label="End Date" value={dates.end || "N/A"} />
          <LabelItem
            label="Draft Duration"
            value={formatStageValue(durations.draft, formationStages?.draft)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <LabelItem
            label="Review Duration"
            value={formatStageValue(durations.review, formationStages?.review)}
          />
          <LabelItem
            label="Approval Duration"
            value={formatStageValue(
              durations.approval,
              formationStages?.approval,
            )}
          />
          <LabelItem
            label="Execution Duration"
            value={formatStageValue(
              durations.execution,
              formationStages?.execution,
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <LabelItem
            label="Contract Manager"
            value={contractManager || "N/A"}
          />
          <LabelItem
            label="Status"
            children={
              <StatusBadge status={status.label?.toLowerCase() as Status} />
            }
          />
        </div>

        <LabelItem label="Description" value={msa?.description || "N/A"} />
      </div>

      <div className="col-span-1 md:col-span-3 space-y-4">
        <div className="text-base font-semibold text-gray-600 dark:text-slate-300">
          Contract Team
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-slate-500 dark:text-slate-400 block">Internal Stakeholder</span>
            <div className="flex flex-col gap-1">
              {internalTeam.length > 0 ? (
                internalTeam.map((member, idx) => {
                  const name =
                    typeof member === "string" ? member : (member?.name ?? "");
                  const email =
                    typeof member === "string" ? undefined : member?.email;
                  const role =
                    typeof member === "string" ? undefined : member?.role;
                  return (
                    <EmployeeCardPopover
                      key={`${name}-${idx}`}
                      triggerLabel={name || "View Member"}
                      name={name || email || "Member"}
                      email={email || "N/A"}
                      role={role || "N/A"}
                      phone="N/A"
                    />
                  );
                })
              ) : (
                <span className="text-slate-900 dark:text-slate-100">N/A</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-slate-500 dark:text-slate-400 block">
              Vendor/Contractor Key Personnel
            </span>
            <div className="flex flex-col gap-1">
              {vendorPersonnel.length > 0 ? (
                vendorPersonnel.map((person, idx) => (
                  <EmployeeCardPopover
                    key={`${person?.email ?? person?.name ?? idx}`}
                    triggerLabel={
                      person?.name || person?.email || "View Personnel"
                    }
                    name={person?.name || "N/A"}
                    email={person?.email || "N/A"}
                    role={person?.role || "N/A"}
                    phone={person?.phone || "N/A"}
                  />
                ))
              ) : (
                <span className="text-slate-900 dark:text-slate-100">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
