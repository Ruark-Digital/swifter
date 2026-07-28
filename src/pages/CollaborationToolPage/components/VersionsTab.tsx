import React from "react";
import {
  RotateCcw,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
  Pencil,
} from "lucide-react";
import { cn, formatDateTZ } from "@/lib/utils";
import type { Version, VersionKind } from "./VersionHistoryModal";

interface VersionsTabProps {
  versions: Version[];
  onRestore: (versionId: string) => void;
  /** True while the BE version list is loading on first paint. */
  isLoading?: boolean;
}

const KIND_META: Record<
  VersionKind,
  { Icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  edit: {
    Icon: Pencil,
    tone:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    label: "Edit",
  },
  insertion: {
    Icon: Plus,
    tone:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    label: "Insertion",
  },
  deletion: {
    Icon: Minus,
    tone: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    label: "Deletion",
  },
  comment: {
    Icon: MessageSquare,
    tone:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    label: "Comment",
  },
  "ai-apply": {
    Icon: Sparkles,
    tone:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    label: "AI apply",
  },
};

const formatRelativeOrAbsolute = (iso: string): string => {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return formatDateTZ(iso, "MMM d, yyyy h:mm a");
};

const VersionsTab: React.FC<VersionsTabProps> = ({
  versions,
  onRestore,
  isLoading = false,
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Version history
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isLoading
              ? "Loading versions…"
              : versions.length === 0
                ? "Track-change snapshots will appear here"
                : `${versions.length} snapshot${versions.length === 1 ? "" : "s"} · newest first`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            Snapshots are taken automatically when you add a redline,
            accept an AI suggestion, or post a comment. Click any entry's{" "}
            <span className="font-semibold">Restore</span> button to revert
            the document to that point.
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-slate-200 pl-4 dark:border-slate-800">
            {versions.map((version) => {
              const meta = KIND_META[version.kind ?? "comment"];
              const Icon = meta.Icon;
              return (
                <li
                  key={version.id}
                  className="relative rounded-md border border-slate-100 bg-white p-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <span
                    className={cn(
                      "absolute -left-[26px] top-3 inline-flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950",
                      meta.tone,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            meta.tone,
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatRelativeOrAbsolute(version.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                        {version.label ?? "Saved version"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        by {version.author}
                      </div>
                    </div>
                    {version.source !== "be" && (
                      <button
                        onClick={() => onRestore(version.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        aria-label={`Restore ${version.label ?? "version"} from ${formatRelativeOrAbsolute(version.timestamp)}`}
                        title="Replace the current document with this snapshot"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default VersionsTab;
