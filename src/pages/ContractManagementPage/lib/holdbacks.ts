type HoldbackStatusBadgeProps = { label: string; className: string };

const normalizeLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const getHoldbackStatusBadgeProps = (
  status?: string | null,
): HoldbackStatusBadgeProps => {
  const raw = typeof status === "string" ? status.trim() : "";
  const normalized = raw.toLowerCase();

  if (!raw) {
    return {
      label: "—",
      className: "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]",
    };
  }

  if (normalized === "approved") {
    return {
      label: "Approved",
      className: "bg-[#EAF7EE] text-[#16A34A] hover:bg-[#EAF7EE]",
    };
  }

  if (normalized === "pending") {
    return {
      label: "Pending",
      className: "bg-[#FEF9C3] text-[#CA8A04] hover:bg-[#FEF9C3]",
    };
  }

  if (normalized === "rejected") {
    return {
      label: "Rejected",
      className: "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]",
    };
  }

  return {
    label: normalizeLabel(raw),
    className: "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]",
  };
};
