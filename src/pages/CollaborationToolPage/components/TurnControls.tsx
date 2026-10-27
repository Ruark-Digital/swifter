import React from "react";
import { ArrowRightLeft, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { RedlineHolder, RedlineTurn } from "../collab/useRedlineTurn";

const SIDE_LABEL: Record<RedlineHolder, string> = {
  manager: "Company (CM/PL)",
  vendor: "Vendor (PM)",
};

interface TurnControlsProps {
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

/** Squared icon button used for the header turn actions. */
const ICON_BTN =
  "inline-flex h-7 w-7 items-center justify-center rounded-md transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40";

/**
 * Compact, header-resident redline turn controls. Replaces the full-width
 * in-panel banner: a status chip (short label + tooltip with the full sentence)
 * and two icon actions (hand-off, finalize) — each with a tooltip for context,
 * so the negotiation stays legible without eating vertical space in the panel.
 */
const TurnControls: React.FC<TurnControlsProps> = ({
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
  // No turn state yet, and a non-participant with nothing to negotiate: hide.
  if (!turn && !mySide) return null;

  const otherSide: RedlineHolder | null =
    mySide === "manager" ? "vendor" : mySide === "vendor" ? "manager" : null;
  const canFinalize = isMyTurn && pendingCount === 0;

  let fullStatus: string;
  let shortStatus: string;
  let tone: "active" | "waiting" | "done";
  if (isFinalized) {
    fullStatus = "Redline negotiation finalized";
    shortStatus = "Finalized";
    tone = "done";
  } else if (!mySide) {
    fullStatus = turn
      ? `${SIDE_LABEL[turn.holder]} is reviewing`
      : "Redline negotiation";
    shortStatus = turn ? SIDE_LABEL[turn.holder] : "Redline";
    tone = "waiting";
  } else if (isMyTurn) {
    fullStatus = "Your turn — review, modify, or reject redlines";
    shortStatus = "Your turn";
    tone = "active";
  } else if (turn) {
    fullStatus = `Waiting on the ${SIDE_LABEL[turn.holder]}`;
    shortStatus = "Waiting";
    tone = "waiting";
  } else {
    fullStatus = "Redline negotiation";
    shortStatus = "Redline";
    tone = "waiting";
  }

  const StatusIcon = isFinalized
    ? CheckCircle2
    : isMyTurn
      ? ArrowRightLeft
      : Lock;

  const chipTone =
    tone === "done"
      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50"
      : tone === "active"
        ? "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50"
        : "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex cursor-default items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                chipTone,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden lg:inline">{shortStatus}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{fullStatus}</TooltipContent>
        </Tooltip>

        {mySide && !isFinalized && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!isMyTurn || isSending}
                  aria-label={`Send document to the ${otherSide ? SIDE_LABEL[otherSide] : "other side"}`}
                  className={cn(
                    ICON_BTN,
                    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isMyTurn
                  ? `Send to ${otherSide ? SIDE_LABEL[otherSide] : "the other side"}`
                  : "Only the current turn holder can send"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onFinalize}
                  disabled={!canFinalize || isFinalizing}
                  aria-label="Accept and finalize the negotiation"
                  className={cn(
                    ICON_BTN,
                    canFinalize
                      ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                      : "text-slate-400 dark:text-slate-600",
                  )}
                >
                  {isFinalizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {!isMyTurn
                  ? "Only the current turn holder can finalize"
                  : pendingCount > 0
                    ? `Resolve all ${pendingCount} open suggestion${pendingCount === 1 ? "" : "s"} before finalizing`
                    : "Accept & finalize the negotiation"}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TurnControls;
