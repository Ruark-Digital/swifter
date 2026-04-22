
type LabelItemProps = {
  label: string;
  value?: any;
}

export const LabelItem = ({
  label,
  value,
}: LabelItemProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
};
