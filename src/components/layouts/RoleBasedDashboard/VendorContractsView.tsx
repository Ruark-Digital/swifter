import { CardStats } from "./components/StatsCard";
import { useVendorContractStats } from "@/hooks/useVendorContractStats";

interface VendorContractsViewProps {
  enabled: boolean;
}

const STAT_CONFIGS = [
  { key: "all" as const, title: "All Contracts", color: "text-gray-500", bgColor: "bg-gray-500/20" },
  { key: "active" as const, title: "Active", color: "text-green-600", bgColor: "bg-green-500/20" },
  { key: "completed" as const, title: "Completed", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { key: "suspended" as const, title: "Suspended", color: "!text-yellow-500", bgColor: "bg-yellow-500/20" },
  { key: "expired" as const, title: "Expired", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { key: "cancelled" as const, title: "Cancelled", color: "text-red-500", bgColor: "bg-red-500/20" },
];

export function VendorContractsView({ enabled }: VendorContractsViewProps) {
  const { data } = useVendorContractStats(enabled);

  const zeros = { all: 0, active: 0, completed: 0, suspended: 0, expired: 0, cancelled: 0 };
  const stats = data ?? zeros;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {STAT_CONFIGS.map((cfg) => (
        <CardStats
          key={cfg.title}
          title={cfg.title}
          value={stats[cfg.key]}
          icon="folder-open"
          color={cfg.color}
          bgColor={cfg.bgColor}
        />
      ))}
    </div>
  );
}
