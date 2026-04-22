import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
    variant?: "default" | "success" | "error"
  }
>(({ className, value = 0, max = 100, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "h-full w-full flex-1 transition-all duration-300 ease-in-out",
        variant === "success" && "bg-green-500",
        variant === "error" && "bg-red-500",
        variant === "default" && "bg-slate-900 dark:bg-slate-50"
      )}
      style={{ transform: `translateX(-${100 - (value / max) * 100}%)` }}
    />
  </div>
))

Progress.displayName = "Progress"

export { Progress }