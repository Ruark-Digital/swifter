import * as React from "react";

import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
}

const variantClasses: Record<NonNullable<AlertProps["variant"]>, string> = {
  default:
    "border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
  destructive:
    "border border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200",
  success:
    "border border-green-200 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-900/20 dark:text-green-200",
  warning:
    "border border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-900/20 dark:text-yellow-200",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-xl p-6 shadow-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold", className)} {...props} />
  )
);

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-600", className)} {...props} />
));

