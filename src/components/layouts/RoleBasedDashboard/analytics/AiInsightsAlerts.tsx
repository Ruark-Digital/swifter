import React from "react";
import type { ContractAiInsight } from "@/hooks/useDashboardData";

type Props = {
  data?: ContractAiInsight[];
  isLoading?: boolean;
};

// Map each insight type to a representative icon. Unknown types fall back to a bell.
const ICON_BY_TYPE: Record<string, string> = {
  budget_risk: "⚠️",
  high_risk_clause_exposure: "🎯",
  clause_coverage_gap: "📋",
  renegotiation_opportunity: "💡",
  value_leakage: "💰",
  open_ncr: "🚧",
  pending_invoice_backlog: "🧾",
  open_claims: "⚖️",
  overdue_rfi: "⏰",
  high_urgency_changes: "🔥",
};

export const AiInsightsAlerts: React.FC<Props> = ({ data, isLoading }) => {
  const items = data ?? [];

  return (
    <div className="rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 md:p-8 lg:p-10 bg-gradient-to-r from-[#2563eb] to-[#7e22ce] text-white">
      <p className="text-[20px] font-semibold mb-4">AI Insights & Alerts</p>

      {isLoading ? (
        <div className="rounded-lg bg-white/20 backdrop-blur p-4 text-[14px]">
          Analyzing your contract portfolio…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-white/20 backdrop-blur p-4 text-[14px]">
          No insights or alerts right now — your contract portfolio looks healthy.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg bg-white/20 backdrop-blur p-4">
              <p className="text-[16px] font-semibold">
                {ICON_BY_TYPE[item.type] ?? "🔔"} {item.title}
              </p>
              <p className="text-[14px]">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
