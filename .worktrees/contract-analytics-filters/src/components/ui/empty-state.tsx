import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icons?: LucideIcon[]
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "bg-white border-slate-200 hover:border-slate-200/80 text-center dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-800/80",
      "border-2 border-dashed rounded-xl p-14 w-full max-w-[620px]",
      "group hover:bg-slate-100/50 transition duration-500 hover:duration-200 dark:hover:bg-slate-800/50",
      className
    )}>
      <div className="flex justify-center isolate">
        {icons.length === 3 ? (
          <>
            <div className="bg-white size-12 grid place-items-center rounded-xl relative left-2.5 top-1.5 -rotate-6 shadow-lg ring-1 ring-slate-200 group-hover:-translate-x-5 group-hover:-rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200 dark:bg-slate-950 dark:ring-slate-800">
              {React.createElement(icons[0], {
                className: "w-6 h-6 text-slate-500 dark:text-slate-400"
              })}
            </div>
            <div className="bg-white size-12 grid place-items-center rounded-xl relative z-10 shadow-lg ring-1 ring-slate-200 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200 dark:bg-slate-950 dark:ring-slate-800">
              {React.createElement(icons[1], {
                className: "w-6 h-6 text-slate-500 dark:text-slate-400"
              })}
            </div>
            <div className="bg-white size-12 grid place-items-center rounded-xl relative right-2.5 top-1.5 rotate-6 shadow-lg ring-1 ring-slate-200 group-hover:translate-x-5 group-hover:rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200 dark:bg-slate-950 dark:ring-slate-800">
              {React.createElement(icons[2], {
                className: "w-6 h-6 text-slate-500 dark:text-slate-400"
              })}
            </div>
          </>
        ) : (
          <div className="bg-white size-12 grid place-items-center rounded-xl shadow-lg ring-1 ring-slate-200 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200 dark:bg-slate-950 dark:ring-slate-800">
            {icons[0] && React.createElement(icons[0], {
              className: "w-6 h-6 text-slate-500 dark:text-slate-400"
            })}
          </div>
        )}
      </div>
      <h2 className="text-slate-950 font-medium mt-6 dark:text-slate-50">{title}</h2>
      <p className="text-sm text-slate-500 mt-1 whitespace-pre-line dark:text-slate-400">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className={cn(
            "mt-4",
            "shadow-sm active:shadow-none"
          )}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}