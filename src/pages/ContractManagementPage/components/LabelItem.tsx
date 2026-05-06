
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
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
};
