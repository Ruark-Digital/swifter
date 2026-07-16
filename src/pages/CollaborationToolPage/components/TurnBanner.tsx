import React from "react";
import { ArrowRightLeft, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedlineHolder, RedlineTurn } from "../collab/useRedlineTurn";

const SIDE_LABEL: Record<RedlineHolder, string> = {
  manager: "Company (CM/PL)",
  vendor: "Vendor (PM)",
};

interface TurnBannerProps {
  /** The current viewer's side, or null for non-participants (read-only). */
  mySide: RedlineHolder | null;
  turn: RedlineTurn | null;
  isMyTurn: boolean;
  isFinalized: boolean;
  /** Open (pending) AI suggestions still needing resolution. */
  pendingCount: number;
  onSend: () => void;
  onFinalize: () => void;
  isSending?: boolean;
  isFinalizing?: boolean;
}

const TurnBanner: React.FC<TurnBannerProps> = ({
  mySide,
  turn,
  isMyTurn,
  isFinalized,
  pendingCount,
  onSend,
  onFinalize,
  isSending,
  isFinalizing,
}) => {
  // No turn state yet, or a non-participant with nothing to negotiate: hide.
  if (!turn && !mySide) return null;

  const otherSide: RedlineHolder | null =
    mySide === "manager" ? "vendor" : mySide === "vendor" ? "manager" : null;

  const canFinalize = isMyTurn && pendingCount === 0;

  let statusText: string;
  if (isFinalized) {
    statusText = "Redline negotiation finalized";
  } else if (!mySide) {
    statusText = turn
      ? `${SIDE_LABEL[turn.holder]} is reviewing`
      : "Redline negotiation";
  } else if (isMyTurn) {
    statusText = "Your turn — review, modify, or reject redlines";
  } else if (turn) {
    statusText = `Waiting on the ${SIDE_LABEL[turn.holder]}`;
  } else {
    statusText = "Redline negotiation";
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3",
        isFinalized
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
          : isMyTurn
            ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/40"
            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="flex items-center gap-2">
        {isFinalized ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : isMyTurn ? (
          <ArrowRightLeft className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {statusText}
        </span>
      </div>

      {mySide && !isFinalized && (
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSend}
            disabled={!isMyTurn || isSending}
            title={
              isMyTurn
                ? `Hand the document to the ${otherSide ? SIDE_LABEL[otherSide] : "other side"}`
                : "Only the current turn holder can send"
            }
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              isMyTurn && !isSending
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500",
            )}
          >
            {isSending
              ? "Sending…"
              : `Send to ${otherSide ? SIDE_LABEL[otherSide] : "other side"}`}
          </button>
          <button
            type="button"
            onClick={onFinalize}
            disabled={!canFinalize || isFinalizing}
            title={
              !isMyTurn
                ? "Only the current turn holder can finalize"
                : pendingCount > 0
                  ? `Resolve all ${pendingCount} open suggestion${pendingCount === 1 ? "" : "s"} before finalizing`
                  : "Finalize the redline negotiation"
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors",
              canFinalize && !isFinalizing
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-300 dark:bg-slate-700",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {isFinalizing ? "Finalizing…" : "Accept & Finalize"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TurnBanner;
