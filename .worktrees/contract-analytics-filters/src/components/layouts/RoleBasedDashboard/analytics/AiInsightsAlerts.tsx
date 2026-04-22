import React from "react";

export const AiInsightsAlerts: React.FC = () => {
  const items = [
    {
      title: "Budget Risk Alert",
      desc: "8 contracts likely to exceed budget by Q2 2025",
      icon: "⚠️",
    },
    {
      title: "High-Risk Exposure",
      desc: "Indemnity clauses driving 45% of risk exposure",
      icon: "🎯",
    },
    {
      title: "Renegotiation Opportunity",
      desc: "3 contracts suitable for renegotiation - potential $2.1M savings",
      icon: "💡",
    },
    {
      title: "Value Leakage Detected",
      desc: "12 change orders lack proper approval documentation",
      icon: "💰",
    },
  ];

  return (
    <div className="rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 md:p-8 lg:p-10 bg-gradient-to-r from-[#2563eb] to-[#7e22ce] text-white">
      <p className="text-[20px] font-semibold mb-4">AI Insights & Alerts</p>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-white/20 backdrop-blur p-4"
          >
            <p className="text-[16px] font-semibold">
              {item.icon} {item.title}
            </p>
            <p className="text-[14px]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

