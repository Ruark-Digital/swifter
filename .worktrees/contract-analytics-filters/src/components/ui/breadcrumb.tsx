import * as React from "react";

import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="Breadcrumb" className={cn("text-sm", className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol className={cn("flex items-center gap-2", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center gap-2", className)} {...props} />;
}

export function BreadcrumbSeparator({ className, ...props }: React.ComponentProps<"span">) {
  return <span aria-hidden="true" className={cn("mx-1 text-slate-400", className)} {...props}>›</span>;
}

export function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cn("text-slate-500 hover:text-slate-900", className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span aria-current="page" className={cn("text-slate-900", className)} {...props} />;
}

