import React from "react";
import { Badge } from "@/components/ui/badge";
import EmployeeCardPopover from "@/pages/ContractManagementPage/components/EmployeeCardPopover";

type InternalMember = string | { name?: string; email?: string; role?: string };
type VendorPerson = { name?: string; email?: string; role?: string; phone?: string };

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
  durations: { draft?: string; review?: string; approval?: string; execution?: string };
  status: { label?: string; className?: string };
  internalTeam: InternalMember[];
  vendorPersonnel: VendorPerson[];
};

const Overview: React.FC<Props> = ({
  msa,
  dates,
  durations,
  status,
  internalTeam,
  vendorPersonnel,
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Contract Name</span>
            <span className="text-slate-900 font-medium">{msa?.title || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">MSA ID</span>
            <span className="text-slate-900 font-medium">{msa?.msaContractId || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">MSA Type</span>
            <span className="text-slate-900 font-medium">{msa?.msaType || "N/A"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Deviation Scale</span>
            <span className="text-slate-900 font-medium">
              {typeof msa?.rating === "number" ? String(msa?.rating) : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Business Division</span>
            <span className="text-slate-900 font-medium">{msa?.businessDivision || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Published Date</span>
            <span className="text-slate-900 font-medium">{dates.published || "N/A"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Effective Date</span>
            <span className="text-slate-900 font-medium">{dates.effective || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">End Date</span>
            <span className="text-slate-900 font-medium">{dates.end || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Draft Duration</span>
            <span className="text-slate-900 font-medium">{durations.draft || "N/A"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Review Duration</span>
            <span className="text-slate-900 font-medium">{durations.review || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Approval Duration</span>
            <span className="text-slate-900 font-medium">{durations.approval || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">Execution Duration</span>
            <span className="text-slate-900 font-medium">{durations.execution || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <span className="text-slate-500 block">Contract Manager</span>
            <span className="text-slate-900">N/A</span>
          </div>
          <div className="space-y-2">
            <span className="text-slate-500 block">Status</span>
            <Badge className={status?.className}>{status?.label}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-slate-500 block">Description</span>
          <p className="text-slate-700 max-w-3xl">{msa?.description || "N/A"}</p>
        </div>
      </div>

      <div className="col-span-1 md:col-span-3 space-y-4">
        <div className="text-base font-semibold text-gray-600">Contract Team</div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-slate-500 block">Internal Stakeholder</span>
            <div className="flex flex-col gap-1">
              {internalTeam.length > 0 ? (
                internalTeam.map((member, idx) => {
                  const name = typeof member === "string" ? member : member?.name ?? "";
                  const email = typeof member === "string" ? undefined : member?.email;
                  const role = typeof member === "string" ? undefined : member?.role;
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
                <span className="text-slate-900">N/A</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-slate-500 block">Vendor/Contractor Key Personnel</span>
            <div className="flex flex-col gap-1">
              {vendorPersonnel.length > 0 ? (
                vendorPersonnel.map((person, idx) => (
                  <EmployeeCardPopover
                    key={`${person?.email ?? person?.name ?? idx}`}
                    triggerLabel={person?.name || person?.email || "View Personnel"}
                    name={person?.name || "N/A"}
                    email={person?.email || "N/A"}
                    role={person?.role || "N/A"}
                    phone={person?.phone || "N/A"}
                  />
                ))
              ) : (
                <span className="text-slate-900">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
