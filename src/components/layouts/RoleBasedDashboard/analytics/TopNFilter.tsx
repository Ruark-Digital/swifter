import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  options?: number[];
};

/**
 * Top-N selector for ranking visuals (Pareto: Top 10 / Top 20).
 * Replaces the old decorative "Top 10" badge with a real segmented control.
 */
export const TopNFilter: React.FC<Props> = ({
  value,
  onChange,
  options = [10, 20],
}) => (
  <div className="inline-flex items-center gap-0.5 border border-[#E5E7EB] dark:border-slate-700 rounded-lg p-0.5">
    {options.map((n) => {
      const active = value === n;
      return (
        <button
          key={n}
          type="button"
          aria-pressed={active}
          onClick={() => onChange?.(n)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            active
              ? "bg-[#F0F0F0] text-[#2A4467] dark:bg-slate-800 dark:text-slate-100"
              : "text-[#6B6B6B] dark:text-slate-400 hover:text-[#2A4467] dark:hover:text-slate-200",
          )}
        >
          Top {n}
        </button>
      );
    })}
  </div>
);
