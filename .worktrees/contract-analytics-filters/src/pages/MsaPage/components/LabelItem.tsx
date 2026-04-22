import { ReactNode } from "react";

type LabelItemProps = {
  label: string;
  value?: string | number;
  children?: ReactNode;
}

export const LabelItem = ({
  label,
  value,
  children,
}: LabelItemProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-500">{label}</span>
     {children || (
      <span className="text-slate-900 font-medium">{value || "N/A"}</span>
     )}
    </div>
  );
};
