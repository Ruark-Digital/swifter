import React from "react";
import {
  RotateCcw,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
  Pencil,
  History,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { cn, formatDateTZ } from "@/lib/utils";
import type { Version, VersionKind } from "./VersionHistoryModal";

interface VersionsTabProps {
  versions: Version[];
  onRestore: (versionId: string) => void;
  /** True while the BE version list is loading on first paint. */
  isLoading?: boolean;
  /** Id of the version the live document is currently based on. Falls back to
   *  the most recent snapshot when the BE doesn't report one. */
  activeVersionId?: string | null;
  /** Id of the version currently being restored (shows a pending state). */
  restoringVersionId?: string | null;
}

const KIND_META: Record<
  VersionKind,
  {
    Icon: React.ComponentType<{ className?: string }>;
    /** Rail node colours (background + icon). */
    node: string;
    /** Inline chip colours, shown only for change-type entries. */
    chip: string;
    label: string;
    /** Generic edits repeat on every collab snapshot — no chip for those. */
    chip_hidden?: boolean;
  }
> = {
  edit: {
    Icon: Pencil,
    node: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    chip: "",
    label: "Edit",
    chip_hidden: true,
  },
  insertion: {
    Icon: Plus,
    node: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    label: "Insertion",
  },
  deletion: {
    Icon: Minus,
    node: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    label: "Deletion",
  },
  comment: {
    Icon: MessageSquare,
    node: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    label: "Comment",
  },
  "ai-apply": {
    Icon: Sparkles,
    node: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    label: "AI apply",
  },
};

const startOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Human day bucket for the sticky section headers. */
const dayLabel = (iso: string): string => {
  const then = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return formatDateTZ(iso, "EEEE"); // Monday, Tuesday…
  return formatDateTZ(iso, "MMM d, yyyy");
};

/** Time within a day — relative for the last hour, clock time otherwise (the
 *  day is already carried by the section header, so no need to repeat it). */
const timeLabel = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return formatDateTZ(iso, "h:mm a");
};

type DayGroup = { label: string; items: Version[] };

/** Bucket the already-sorted (newest-first) versions into contiguous day groups. */
const groupByDay = (versions: Version[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const v of versions) {
    const label = dayLabel(v.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(v);
    else groups.push({ label, items: [v] });
  }
  return groups;
};

const SkeletonRow: React.FC<{ delay: number }> = ({ delay }) => (
  <li
    className="relative animate-pulse pl-9"
    style={{ animationDelay: `${delay}ms` }}
    aria-hidden="true"
  >
    <span className="absolute left-[9px] top-1 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800" />
    <div className="space-y-2 py-0.5">
      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-2.5 w-2/5 rounded bg-slate-100 dark:bg-slate-800/60" />
    </div>
  </li>
);

const VersionsTab: React.FC<VersionsTabProps> = ({
  versions,
  onRestore,
  isLoading = false,
  activeVersionId = null,
  restoringVersionId = null,
}) => {
  const groups = React.useMemo(() => groupByDay(versions), [versions]);
  // The version the live doc is based on; fall back to the newest snapshot so
  // there's always a clear "you are here" anchor.
  const currentId = activeVersionId ?? versions[0]?.id ?? null;
  // Restore replaces the current document, so require an inline confirm before
  // firing. Holds the id of the row awaiting confirmation (one at a time).
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <History className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Version history
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isLoading
                ? "Loading versions…"
                : versions.length === 0
                  ? "Snapshots appear here"
                  : `${versions.length} snapshot${versions.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
        {!isLoading && versions.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Auto-saved
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <ol className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} delay={i * 80} />
            ))}
          </ol>
        ) : versions.length === 0 ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <History className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No versions yet
            </p>
            <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Snapshots are captured automatically as you edit, redline, accept
              an AI suggestion, or comment. Restore any point from here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group, gi) => {
              // Continuous stagger index across all rows for the entrance fade.
              const priorCount = groups
                .slice(0, gi)
                .reduce((n, g) => n + g.items.length, 0);
              return (
                <section key={group.label}>
                  <div className="sticky top-0 z-10 -mx-5 mb-2 bg-slate-50/80 px-5 py-1.5 backdrop-blur dark:bg-slate-950/80">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.label}
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-300 dark:text-slate-600">
                        · {group.items.length}
                      </span>
                    </h3>
                  </div>
                  <ol className="relative space-y-1">
                    {/* Rail line runs through the node centres (left 18px). */}
                    <span
                      className="absolute left-[17px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800"
                      aria-hidden="true"
                    />
                    {group.items.map((version, ii) => {
                      const meta = KIND_META[version.kind ?? "edit"];
                      const Icon = meta.Icon;
                      const isCurrent = version.id === currentId;
                      // Local snapshots always restore client-side; BE rows
                      // restore only when the server marks them restorable.
                      // Never offer restore on the current version (no-op).
                      const canRestore =
                        !isCurrent &&
                        (version.source === "be"
                          ? version.restorable === true
                          : true);
                      const isRestoring = restoringVersionId === version.id;
                      const isConfirming = confirmingId === version.id;
                      const delay = Math.min(priorCount + ii, 10) * 30;
                      return (
                        <li
                          key={version.id}
                          className="group relative animate-in fade-in slide-in-from-bottom-1 fill-mode-both pl-9"
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          {/* Rail node */}
                          <span
                            className={cn(
                              "absolute left-[7px] top-[7px] z-[1] flex h-[22px] w-[22px] items-center justify-center rounded-full ring-4 ring-slate-50 transition-transform group-hover:scale-110 dark:ring-slate-950",
                              isCurrent
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                                : meta.node,
                            )}
                            aria-hidden="true"
                          >
                            <Icon className="h-3 w-3" />
                          </span>

                          <div
                            className={cn(
                              "rounded-xl border px-3 py-2.5 transition-all",
                              isCurrent
                                ? "border-blue-200 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10"
                                : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-slate-800 dark:hover:bg-slate-900",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      "truncate text-sm font-medium",
                                      isCurrent
                                        ? "text-blue-900 dark:text-blue-100"
                                        : "text-slate-800 dark:text-slate-100",
                                    )}
                                  >
                                    {version.label ?? "Saved version"}
                                  </span>
                                  {isCurrent && (
                                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                      Current
                                    </span>
                                  )}
                                  {!meta.chip_hidden && (
                                    <span
                                      className={cn(
                                        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                        meta.chip,
                                      )}
                                    >
                                      {meta.label}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  <span
                                    title={formatDateTZ(
                                      version.timestamp,
                                      "MMM d, yyyy h:mm a",
                                    )}
                                  >
                                    {timeLabel(version.timestamp)}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">
                                    ·
                                  </span>
                                  <span className="truncate">{version.author}</span>
                                </div>
                              </div>

                              {canRestore && isRestoring ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Restoring…
                                </span>
                              ) : canRestore && isConfirming ? (
                                // Inline confirm — restore replaces the current
                                // document, so it takes a deliberate second tap.
                                <span className="inline-flex shrink-0 items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setConfirmingId(null);
                                      onRestore(version.id);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                    aria-label={`Confirm restore of ${version.label ?? "version"} from ${timeLabel(version.timestamp)}`}
                                    title="Replace the current document with this snapshot"
                                  >
                                    <Check className="h-3 w-3" />
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmingId(null)}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                    aria-label="Cancel restore"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ) : canRestore ? (
                                <button
                                  onClick={() => setConfirmingId(version.id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 opacity-0 transition-all hover:border-blue-300 hover:text-blue-600 focus-visible:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
                                  aria-label={`Restore ${version.label ?? "version"} from ${timeLabel(version.timestamp)}`}
                                  title="Replace the current document with this snapshot"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Restore
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionsTab;
