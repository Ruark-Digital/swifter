import React from "react";
import { TabsContent } from "@/components/ui/tabs";

type ClauseCardProps = {
  title: string;
  risk: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";
  riskTone: "low" | "medium" | "high";
  summary: string;
  fullDetails: React.ReactNode;
  ratesValues?: React.ReactNode;
};

function RiskPill({
  tone,
  children,
}: {
  tone: ClauseCardProps["riskTone"];
  children: string;
}) {
  const bg =
    tone === "low" ? "bg-[#DCFCE7]" : tone === "medium" ? "bg-[#FEF9C3]" : "bg-[#FEE2E2]";
  const text =
    tone === "low" ? "text-[#166534]" : tone === "medium" ? "text-[#854D0E]" : "text-[#991B1B]";
  return (
    <div className={`inline-flex rounded px-2 py-1 ${bg}`}>
      <span className={`text-xs font-semibold leading-4 ${text}`}>{children}</span>
    </div>
  );
}



function RatesValuesBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border-l-4 border-[#22C55E] bg-[#F0FDF4] px-2 py-3">
      <div className="text-sm font-semibold leading-5 text-[#14532D]">💰 Rates & Values</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RatesTable({
  rows,
  borderColor,
}: {
  rows: Array<{ left: string; middle: string; right: string }>;
  borderColor: string;
}) {
  return (
    <div className="flex w-full flex-col">
      {rows.map((r, idx) => (
        <div
          key={`${r.left}-${idx}`}
          className={`flex justify-center border-b ${idx === rows.length - 1 ? "border-b-0" : ""}`}
          style={{ borderColor }}
        >
          <div className="flex w-[460px] px-1 py-2 text-sm leading-5 text-[#374151]">
            {r.left}
          </div>
          <div className="flex w-[229px] justify-end px-1 py-2 text-sm font-semibold leading-5 text-[#14532D]">
            {r.middle}
          </div>
          <div className="flex w-[345px] justify-end px-1 py-2 text-sm leading-5 text-[#4B5563]">
            {r.right}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryCard({
  iconSrc,
  iconBg,
  title,
  clausesCount,
  showUpdateButton,
  children,
}: {
  iconSrc: string;
  iconBg: string;
  title: string;
  clausesCount: string;
  showUpdateButton: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-lg border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_#0000000d]">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center">
          <div className="rounded-lg p-2" style={{ background: iconBg }}>
            <img src={iconSrc} className="h-6 w-6" />
          </div>
          <div className="pl-3">
            <div className="text-[18px] font-semibold leading-7 text-[#030712]">
              {title}
            </div>
            <div className="text-sm leading-5 text-[#4B5563]">{clausesCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showUpdateButton && (
            <button
              type="button"
              className="h-[52px] w-[208px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] px-[15px] py-[14px] text-base font-semibold leading-6 text-[#0F0F0F]"
            >
              Update Clause
            </button>
          )}
          <img
            src="/assets/contract-management/clause-library/chevron-down.svg"
            className="h-6 w-6"
          />
        </div>
      </div>

      <div className="border-t border-[#E5E7EB]">{children}</div>
    </div>
  );
}

function ClauseCard({ title, risk, riskTone, summary, fullDetails, ratesValues }: ClauseCardProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] px-5 py-5">
      <div className="flex items-start justify-between">
        <div className="text-base font-semibold leading-6 text-[#111827]">{title}</div>
        <RiskPill tone={riskTone}>{risk}</RiskPill>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col rounded border-l-4 border-[#3B82F6] bg-[#EFF6FF] px-2 py-3">
          <div className="text-sm font-semibold leading-5 text-[#1E3A8A]">📋 Summary</div>
          <div className="mt-1 text-sm leading-5 text-[#374151]">{summary}</div>
        </div>

        {ratesValues && <RatesValuesBlock>{ratesValues}</RatesValuesBlock>}

        <div className="rounded bg-[#F9FAFB] p-3">
          <div className="text-sm font-semibold leading-5 text-[#111827]">📄 Full Details</div>
          <div className="mt-1 text-sm leading-5 text-[#374151]">{fullDetails}</div>
        </div>
      </div>
    </div>
  );
}

const ClauseLibraryTabContent: React.FC = () => {
  return (
    <TabsContent value="clause-library" className="space-y-6 pb-8">
      <div className="flex max-w-[1152px] flex-col gap-4 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold leading-8 text-[#2563EB]">Clause Library</div>
            <div className="text-sm leading-5 text-[#4B5563]">
              Contract Cheat Sheet - Quick Reference Guide
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2"
          >
            <img
              src="/assets/contract-management/clause-library/export-pdf.svg"
              className="h-[18px] w-[18px]"
            />
            <span className="pl-2 text-base leading-6 text-white">Export PDF</span>
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#BFDBFE] bg-[linear-gradient(90deg,#EFF6FF_0%,#FAF5FF_100%)] p-[15px]">
          <div className="inline-flex items-center">
            <div className="inline-flex flex-col">
              <div className="text-xs leading-4 text-[#4B5563]">Contract ID</div>
              <div className="text-base font-semibold leading-6 text-[#030712]">C-2024-156</div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB]" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563]">Contract Name</div>
              <div className="text-base font-semibold leading-6 text-[#030712]">
                Building Construction Phase 2
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB]" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563]">Vendor</div>
              <div className="text-base font-semibold leading-6 text-[#030712]">
                BuildCorp Ltd
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB]" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563]">Value</div>
              <div className="text-base font-semibold leading-6 text-[#16A34A]">$15.5M</div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB]" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563]">Duration</div>
              <div className="text-base font-semibold leading-6 text-[#030712]">
                2024-01-15 to 2025-06-30
              </div>
            </div>
          </div>

          <div className="inline-flex rounded-full bg-[#22C55E] px-3 py-1">
            <span className="text-sm font-semibold leading-5 text-white">Active</span>
          </div>
        </div>
      </div>

      <div className="relative h-[50px] w-[1152px] overflow-hidden rounded-lg border border-[#D1D5DB] bg-white px-[15px] py-[12px] pl-[47px]">
        <div className="text-base text-[#9CA3AF]">
          Search clauses... (e.g., payment terms, insurance, liquidated damages)
        </div>
        <img
          src="/assets/contract-management/clause-library/search.svg"
          className="absolute left-[15px] top-[14px] h-5 w-5"
        />
      </div>

      <div className="flex w-[1152px] flex-col gap-6 pb-8">
        <div className="flex w-full flex-col gap-4">
          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-general-terms.svg"
            iconBg="#3B82F615"
            title="General Terms"
            clausesCount="4 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Contract Parties"
                risk="LOW RISK"
                riskTone="low"
                summary="Agreement between XYZ Corporation (Owner) and BuildCorp Ltd (Contractor)"
                fullDetails={
                  <>
                    Owner: XYZ Corporation, 123 Main St, City
                    <br />
                    Contractor: BuildCorp Ltd, 456 Builder Ave, Town
                  </>
                }
              />
              <ClauseCard
                title="Scope of Work"
                risk="LOW RISK"
                riskTone="low"
                summary="Construction of 15-story commercial office building including foundation, structure, MEP, and finishing"
                fullDetails="Complete construction services for Downtown Tower Phase 2 including all labor, materials, equipment, and supervision"
              />
              <ClauseCard
                title="Contract Duration"
                risk="LOW RISK"
                riskTone="low"
                summary="18 months from Jan 15, 2024 to Jun 30, 2025"
                fullDetails={
                  <>
                    Effective Date: January 15, 2024
                    <br />
                    Final Completion/Delivery Date: June 30, 2025
                  </>
                }
              />
              <ClauseCard
                title="Governing Law"
                risk="LOW RISK"
                riskTone="low"
                summary="Laws of the State of California"
                fullDetails="This agreement shall be governed by and construed in accordance with the laws of California"
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-financial-terms.svg"
            iconBg="#10B98115"
            title="Financial Terms"
            clausesCount="4 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Contract Value"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Original: $12.8M | Current: $15.5M (includes 8 approved change orders)"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Base Contract", middle: "$12.8M", right: "Lump Sum" },
                      { left: "Change Orders", middle: "$2.7M", right: "Cumulative" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Base Contract Price: $12,800,000
                    <br />
                    Approved Change Orders: $2,700,000
                    <br />
                    Total Current Value: $15,500,000
                  </>
                }
              />
              <ClauseCard
                title="Payment Terms"
                risk="LOW RISK"
                riskTone="low"
                summary="Monthly progress payments within 30 days of invoice submission"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Payment Period", middle: "30 days", right: "Net" },
                      { left: "Retention", middle: "10%", right: "of progress payment" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Net 30 days from invoice date
                    <br />
                    Progress payments based on % completion
                    <br />
                    Retention: 10% held until final completion
                  </>
                }
              />
              <ClauseCard
                title="Payment Milestones"
                risk="LOW RISK"
                riskTone="low"
                summary="5 major milestones: Mobilization (Paid), Foundation (Paid), Structure (Due), Finishing (Pending), Completion (Pending)"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Mobilization", middle: "$2.5M", right: "Paid ✓" },
                      { left: "Foundation", middle: "$3.2M", right: "Paid ✓" },
                      { left: "Structure", middle: "$4.8M", right: "Due" },
                      { left: "Finishing", middle: "$3.5M", right: "Pending" },
                      { left: "Completion", middle: "$1.5M", right: "Pending" },
                    ]}
                  />
                }
                fullDetails="Milestone-based payment structure tied to project phases"
              />
              <ClauseCard
                title="Retention & Holdback"
                risk="LOW RISK"
                riskTone="low"
                summary="10% retention held until final completion, currently $750,000"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Retention Rate", middle: "10%", right: "per payment" },
                      { left: "Current Holdback", middle: "$750K", right: "Total" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Retention Amount: 10% of each progress payment
                    <br />
                    Release: Upon final completion and acceptance
                    <br />
                    Current Holdback: $750,000
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-schedule.svg"
            iconBg="#F59E0B15"
            title="Schedule & Milestones"
            clausesCount="3 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Project Schedule"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="18-month construction period with monthly progress reporting"
                fullDetails={
                  <>
                    Critical Path Method (CPM) schedule
                    <br />
                    Monthly updates required
                    <br />
                    Key milestones tracked
                  </>
                }
              />
              <ClauseCard
                title="Time Extension"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Extensions granted for force majeure, owner delays, and approved change orders"
                fullDetails={
                  <>
                    Contractor must notify within 7 days of delay event
                    <br />
                    Time Impact Analysis required for extensions &gt; 30 days
                  </>
                }
              />
              <ClauseCard
                title="Liquidated Damages"
                risk="HIGH RISK"
                riskTone="high"
                summary="$15,000 per day for delays, capped at 10% of contract value ($1.55M)"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Daily LD Rate", middle: "$15,000", right: "per calendar day" },
                      { left: "Grace Period", middle: "15 days", right: "before LDs apply" },
                      { left: "LD Cap", middle: "10%", right: "of contract value" },
                      { left: "Maximum LD", middle: "$1.55M", right: "Total cap" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Daily Rate: $15,000 per calendar day
                    <br />
                    Cap: 10% of total contract value
                    <br />
                    Maximum LD: $1,550,000
                    <br />
                    Grace Period: 15 days
                    <br />
                    Trigger: Substantial completion delay
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-liability.svg"
            iconBg="#EF444415"
            title="Liability & Insurance"
            clausesCount="4 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Indemnification"
                risk="HIGH RISK"
                riskTone="high"
                summary="Contractor indemnifies Owner for claims arising from contractor negligence, capped at contract value"
                fullDetails={
                  <>
                    Mutual indemnification for each party&apos;s negligent acts
                    <br />
                    Cap: Contract value ($15.5M)
                    <br />
                    Exclusions: Owner&apos;s sole negligence, design defects
                  </>
                }
              />
              <ClauseCard
                title="Insurance Requirements"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="General Liability: $5M | Professional Liability: $2M | Workers Comp: Statutory"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "General Liability", middle: "$5M", right: "per occurrence" },
                      { left: "Professional Liability", middle: "$2M", right: "aggregate" },
                      { left: "Workers Comp", middle: "Statutory", right: "as required" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Commercial General Liability: $5,000,000 per occurrence
                    <br />
                    Professional Liability: $2,000,000
                    <br />
                    Workers Compensation: Statutory limits
                    <br />
                    Builder&apos;s Risk: Full replacement value
                  </>
                }
              />
              <ClauseCard
                title="Performance Bond"
                risk="LOW RISK"
                riskTone="low"
                summary="100% performance and payment bonds required"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Performance Bond", middle: "100%", right: "of contract value" },
                      { left: "Payment Bond", middle: "100%", right: "of contract value" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Performance Bond: 100% of contract value
                    <br />
                    Payment Bond: 100% of contract value
                    <br />
                    Bond Company: AAA-rated surety
                  </>
                }
              />
              <ClauseCard
                title="Limitation of Liability"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Each party&apos;s liability limited to contract value except for gross negligence or willful misconduct"
                fullDetails={
                  <>
                    General Cap: Contract value ($15.5M)
                    <br />
                    Exceptions: Gross negligence, willful misconduct, IP infringement
                    <br />
                    No consequential damages
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-termination.svg"
            iconBg="#8B5CF615"
            title="Termination & Changes"
            clausesCount="3 clauses"
            showUpdateButton={false}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Termination for Convenience"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Owner may terminate with 60 days written notice, contractor entitled to costs incurred plus 10% profit"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Notice Period", middle: "60 days", right: "written notice" },
                      { left: "Profit on Termination", middle: "10%", right: "of uncompleted work" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Notice Period: 60 days
                    <br />
                    Compensation: Costs + 10% profit on uncompleted work
                    <br />
                    Wind-down period: 30 days
                  </>
                }
              />
              <ClauseCard
                title="Termination for Default"
                risk="HIGH RISK"
                riskTone="high"
                summary="30-day cure period for contractor default, immediate for safety violations"
                fullDetails={
                  <>
                    Cure Period: 30 days written notice
                    <br />
                    Default Events: Non-payment, abandonment, repeated violations
                    <br />
                    Immediate: Safety violations, insolvency
                  </>
                }
              />
              <ClauseCard
                title="Change Orders"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Written authorization required, equitable adjustment to time and cost"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Subcontractor Work", middle: "15%", right: "markup on cost" },
                      { left: "Equipment Rental", middle: "12%", right: "markup on cost" },
                      { left: "Material", middle: "18%", right: "markup on cost" },
                      { left: "Approval Required", middle: "Written", right: "Both parties" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    All changes must be in writing
                    <br />
                    Pricing: Cost + markup per schedule
                    <br />
                    Time adjustments as mutually agreed
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-performance.svg"
            iconBg="#06B6D415"
            title="Performance & Quality"
            clausesCount="3 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Quality Standards"
                risk="LOW RISK"
                riskTone="low"
                summary="Work must meet industry standards, building codes, and specification requirements"
                fullDetails={
                  <>
                    Compliance: Local building codes, ASTM standards
                    <br />
                    Inspections: Third-party quality assurance
                    <br />
                    Defect correction: At contractor expense
                  </>
                }
              />
              <ClauseCard
                title="Warranty Period"
                risk="LOW RISK"
                riskTone="low"
                summary="2 years from substantial completion for workmanship, manufacturer warranties pass through"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Warranty Period", middle: "2 years", right: "from substantial completion" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Workmanship Warranty: 2 years
                    <br />
                    Materials: Per manufacturer
                    <br />
                    Latent Defects: Separate provisions apply
                  </>
                }
              />
              <ClauseCard
                title="Performance Metrics / SLAs"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Monthly safety score >95%, on-time milestone delivery, quality inspection pass rate >90%"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Safety Target", middle: ">95%", right: "monthly score" },
                      { left: "Quality Target", middle: ">90%", right: "pass rate" },
                      { left: "Deficiency Response", middle: "48 hours", right: "max" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Safety Score: &gt;95% monthly
                    <br />
                    Schedule Adherence: On-time milestones
                    <br />
                    Quality: &gt;90% first-time pass rate
                    <br />
                    Deficiency response: Within 48 hours
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-disputes.svg"
            iconBg="#EC489915"
            title="Dispute Resolution"
            clausesCount="2 clauses"
            showUpdateButton={false}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Dispute Resolution Process"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Negotiation (30 days) → Mediation (30 days) → Arbitration (binding)"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Negotiation Period", middle: "30 days", right: "mandatory" },
                      { left: "Mediation Period", middle: "30 days", right: "mandatory" },
                      { left: "Arbitration", middle: "Binding", right: "AAA rules" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Step 1: Direct negotiation (30 days)
                    <br />
                    Step 2: Mediation via AAA (30 days)
                    <br />
                    Step 3: Binding arbitration via AAA rules
                    <br />
                    Location: California
                  </>
                }
              />
              <ClauseCard
                title="Claims Procedure"
                risk="MEDIUM RISK"
                riskTone="medium"
                summary="Written notice within 14 days of claim event, detailed documentation required"
                fullDetails={
                  <>
                    Notice: Within 14 days of event
                    <br />
                    Documentation: Cost breakdown, schedule impact, supporting evidence
                    <br />
                    Review: Owner responds within 21 days
                  </>
                }
              />
            </div>
          </CategoryCard>

          <CategoryCard
            iconSrc="/assets/contract-management/clause-library/icon-other-terms.svg"
            iconBg="#64748B15"
            title="Other Terms"
            clausesCount="4 clauses"
            showUpdateButton={true}
          >
            <div className="flex flex-col">
              <ClauseCard
                title="Confidentiality"
                risk="LOW RISK"
                riskTone="low"
                summary="5-year confidentiality obligation for proprietary information"
                ratesValues={
                  <RatesTable
                    borderColor="#BBF7D0"
                    rows={[
                      { left: "Confidentiality Period", middle: "5 years", right: "from execution" },
                    ]}
                  />
                }
                fullDetails={
                  <>
                    Duration: 5 years from contract execution
                    <br />
                    Exclusions: Public domain, independently developed
                    <br />
                    Return of materials upon termination
                  </>
                }
              />
              <ClauseCard
                title="Assignment"
                risk="LOW RISK"
                riskTone="low"
                summary="No assignment without prior written consent, consent not unreasonably withheld"
                fullDetails={
                  <>
                    Assignment requires written approval
                    <br />
                    Subcontracting: Pre-approved list in contract
                    <br />
                    Change of control: Deemed assignment
                  </>
                }
              />
              <ClauseCard
                title="Force Majeure"
                risk="LOW RISK"
                riskTone="low"
                summary="Excuses performance for events beyond reasonable control (acts of God, war, pandemic)"
                fullDetails={
                  <>
                    Covered events: Natural disasters, war, terrorism, pandemic, government action
                    <br />
                    Notice: Within 7 days
                    <br />
                    Mitigation required
                  </>
                }
              />
              <ClauseCard
                title="Notices"
                risk="LOW RISK"
                riskTone="low"
                summary="Written notices to contract managers, email acceptable with confirmation"
                fullDetails={
                  <>
                    Method: Registered mail or email with read receipt
                    <br />
                    Owner Contact: Sarah Johnson, contracts@xyzcorp.com
                    <br />
                    Contractor Contact: Mike Stevens, mike@buildcorp.com
                  </>
                }
              />
            </div>
          </CategoryCard>
        </div>

        <div className="flex w-full justify-center gap-4">
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] bg-white p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563]">Total Clauses</div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#2563EB]">
              27
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] bg-white p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563]">High Risk</div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#DC2626]">3</div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] bg-white p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563]">Medium Risk</div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#CA8A04]">
              10
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] bg-white p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563]">Low Risk</div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#16A34A]">
              14
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default ClauseLibraryTabContent;

