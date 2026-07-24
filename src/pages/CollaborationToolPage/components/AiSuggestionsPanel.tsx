import React, { useState } from "react";
import { Sparkles, X, Check, RotateCw, Play, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedlineSpan } from "../collab/redlineScan";
import type {
  AiRedlineSuggestion,
  AiAlternativeLanguage,
  AiRiskLevel,
} from "../collab/useAiRedlineSuggestions";

type Status = "idle" | "loading" | "ready" | "error" | "empty";

export type AlternativeTier = "low" | "medium" | "high";

type Item = {
  redline: RedlineSpan;
  suggestion?: AiRedlineSuggestion;
  state: "pending" | "approved" | "dismissed";
};

interface AiSuggestionsPanelProps {
  open: boolean;
  onClose?: () => void;
  status: Status;
  errorMessage?: string;
  items: Item[];
  /** Apply with the user's chosen alternative-language tier. The default
   *  tier is "medium" — callers should respect the tier when picking the
   *  replacement text to write into the document. */
  onApprove: (item: Item, tier: AlternativeTier) => void;
  onDismiss: (item: Item) => void;
  /** Revert a previously-resolved (approved/dismissed) suggestion back to
   *  pending. When omitted, no Undo control is rendered. */
  onUndo?: (item: Item) => void;
  /** Click a card body to scroll/select the redline in the editor. */
  onFocus?: (item: Item) => void;
  onRetry: () => void;
  /** When "inline", renders without the fixed-overlay chrome so the
   *  panel can live inside a sidebar tab. */
  variant?: "overlay" | "inline";
  /** Turn-based negotiation gate. When false, the Apply/Dismiss controls are
   *  disabled (not hidden) with a tooltip — the viewer must wait for their
   *  turn. Defaults to true so callers without turn state are unaffected. */
  isMyTurn?: boolean;
}

const KindPill: React.FC<{ kind: RedlineSpan["kind"] }> = ({ kind }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      kind === "insertion"
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    )}
  >
    {kind}
  </span>
);

const RiskPill: React.FC<{ risk: AiRiskLevel }> = ({ risk }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
      risk === "high"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : risk === "medium"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    )}
  >
    {risk} risk
  </span>
);

const formatVerdict = (acceptability?: string): string => {
  if (!acceptability) return "review";
  return acceptability.split("-").join(" ");
};

const verdictToneClass = (acceptability?: string): string => {
  if (acceptability === "acceptable") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (acceptability === "not-acceptable") {
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  }
  // conditionally-acceptable or unknown → amber
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
};

const TIER_ORDER: AlternativeTier[] = ["low", "medium", "high"];
const TIER_LABEL: Record<AlternativeTier, string> = {
  low: "Conservative",
  medium: "Balanced",
  high: "Minimal",
};
const TIER_HINT: Record<AlternativeTier, string> = {
  low: "Removes most enforceable language",
  medium: "Preserves intent, adds qualifiers",
  high: "Keeps original meaning, minimal disclaimers",
};

const pickDefaultTier = (alt?: AiAlternativeLanguage): AlternativeTier => {
  if (alt?.medium) return "medium";
  if (alt?.low) return "low";
  if (alt?.high) return "high";
  return "medium";
};

type SuggestionCardProps = {
  item: Item;
  onApprove: (item: Item, tier: AlternativeTier) => void;
  onDismiss: (item: Item) => void;
  onUndo?: (item: Item) => void;
  onFocus?: (item: Item) => void;
  isMyTurn: boolean;
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  item,
  onApprove,
  onDismiss,
  onUndo,
  onFocus,
  isMyTurn,
}) => {
  const { suggestion } = item;
  const isPending = item.state === "pending";
  const [tier, setTier] = useState<AlternativeTier>(() =>
    pickDefaultTier(suggestion?.alternativeLanguage),
  );
  const [showDetails, setShowDetails] = useState(false);

  const alt = suggestion?.alternativeLanguage;
  const availableTiers = TIER_ORDER.filter((t) => Boolean(alt?.[t]));
  const replacementPreview = alt?.[tier] ?? "";
  const hasReplacement = Boolean(replacementPreview);

  const focusable = Boolean(onFocus);

  return (
    <div
      onClick={onFocus ? () => onFocus(item) : undefined}
      onKeyDown={
        onFocus
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFocus(item);
              }
            }
          : undefined
      }
      role={focusable ? "button" : undefined}
      tabIndex={focusable ? 0 : undefined}
      title={focusable ? "Scroll to this redline in the document" : undefined}
      className={cn(
        "rounded-xl border p-3 transition-opacity",
        focusable &&
          "cursor-pointer hover:border-indigo-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:border-indigo-700",
        isPending
          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          : "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-800/30",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <KindPill kind={item.redline.kind} />
        {suggestion && <RiskPill risk={suggestion.riskLevel} />}
        {suggestion?.acceptability && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
              verdictToneClass(suggestion.acceptability),
            )}
          >
            {formatVerdict(suggestion.acceptability)}
          </span>
        )}
        {!isPending && (
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold",
                item.state === "approved"
                  ? "text-green-600 dark:text-green-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {item.state === "approved" ? "Replaced" : "Dismissed"}
            </span>
            {onUndo && (
              <button
                type="button"
                disabled={!isMyTurn}
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo(item);
                }}
                title={isMyTurn ? undefined : "Waiting for your turn"}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  isMyTurn
                    ? "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500",
                )}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <div className="font-semibold text-slate-500 dark:text-slate-400">
          Original
        </div>
        <div className="mt-1 line-clamp-3">{item.redline.text}</div>
      </div>

      {suggestion ? (
        <>
          {/* Recommendation summary (the new long `suggestion` field). */}
          {suggestion.suggestion && (
            <div className="mb-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-slate-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-slate-200">
              <div className="mb-1 font-semibold text-indigo-700 dark:text-indigo-300">
                Recommendation
              </div>
              <div>{suggestion.suggestion}</div>
            </div>
          )}

          {/* Full AI assessment paragraph. */}
          {suggestion.assessment && (
            <div className="mb-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <div className="mb-1 font-semibold text-slate-500 dark:text-slate-400">
                Assessment
              </div>
              <div>{suggestion.assessment}</div>
            </div>
          )}

          {/* Risk-tiered replacement picker. */}
          {availableTiers.length > 0 && (
            <div className="mb-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Alternative language
              </div>
              <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
                {availableTiers.map((t) => {
                  const active = t === tier;
                  return (
                    <button
                      key={t}
                      type="button"
                      title={TIER_HINT[t]}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTier(t);
                      }}
                      className={cn(
                        "flex-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors",
                        active
                          ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300"
                          : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/40",
                      )}
                    >
                      {TIER_LABEL[t]}
                    </button>
                  );
                })}
              </div>
              {replacementPreview && (
                <div className="mt-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs italic text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {replacementPreview}
                </div>
              )}
            </div>
          )}

          {/* Considerations + solution — collapsed by default. */}
          {(suggestion.considerations || suggestion.solution) && (
            <div className="mb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails((s) => !s);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Show legal /
                    commercial / technical
                  </>
                )}
              </button>
              {showDetails && (
                <div className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {suggestion.considerations?.legal && (
                    <div>
                      <div className="font-semibold text-slate-500 dark:text-slate-400">
                        Legal
                      </div>
                      <div>{suggestion.considerations.legal}</div>
                    </div>
                  )}
                  {suggestion.considerations?.commercial && (
                    <div>
                      <div className="font-semibold text-slate-500 dark:text-slate-400">
                        Commercial
                      </div>
                      <div>{suggestion.considerations.commercial}</div>
                    </div>
                  )}
                  {suggestion.considerations?.technical && (
                    <div>
                      <div className="font-semibold text-slate-500 dark:text-slate-400">
                        Technical
                      </div>
                      <div>{suggestion.considerations.technical}</div>
                    </div>
                  )}
                  {suggestion.solution && (
                    <div>
                      <div className="font-semibold text-slate-500 dark:text-slate-400">
                        Next step
                      </div>
                      <div>{suggestion.solution}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isPending && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={!isMyTurn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(item);
                }}
                title={isMyTurn ? undefined : "Waiting for your turn"}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs font-semibold",
                  isMyTurn
                    ? "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    : "cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500",
                )}
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={!hasReplacement || !isMyTurn}
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(item, tier);
                }}
                title={
                  !isMyTurn
                    ? "Waiting for your turn"
                    : hasReplacement
                      ? `Apply ${TIER_LABEL[tier].toLowerCase()} replacement`
                      : "No alternative text available"
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold text-white",
                  hasReplacement && isMyTurn
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "cursor-not-allowed bg-slate-300 dark:bg-slate-700",
                )}
              >
                <Check className="h-3 w-3" /> Apply {TIER_LABEL[tier].toLowerCase()}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-xs italic text-slate-500 dark:text-slate-400">
          No suggestion returned for this redline.
        </div>
      )}
    </div>
  );
};

const AiSuggestionsPanel: React.FC<AiSuggestionsPanelProps> = ({
  open,
  onClose,
  status,
  errorMessage,
  items,
  onApprove,
  onDismiss,
  onUndo,
  onFocus,
  onRetry,
  variant = "overlay",
  isMyTurn = true,
}) => {
  if (!open) return null;

  const remaining = items.filter((i) => i.state === "pending").length;
  const isInline = variant === "inline";

  return (
    <div
      className={
        isInline
          ? "flex h-full w-full flex-col bg-transparent"
          : "fixed inset-y-0 right-0 z-40 flex w-[420px] max-w-[90vw] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      }
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              AI Polish
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {status === "ready"
                ? `${remaining} suggestion${remaining === 1 ? "" : "s"} to review`
                : status === "loading"
                  ? "Asking the AI…"
                  : status === "empty"
                    ? "No redlines in this document"
                    : status === "error"
                      ? "Last request failed"
                      : "Professional rephrases for your redlines"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "ready" && items.length > 0 && (
            <button
              type="button"
              onClick={onRetry}
              title="Regenerate suggestions"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
          {onClose && !isInline && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <RotateCw className="h-4 w-4 animate-spin" />
            Asking AI for professional rephrases…
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <div className="font-semibold">Suggestion request failed</div>
            <div className="mt-1 text-xs">{errorMessage || "Unknown error"}</div>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              <RotateCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {status === "idle" && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-slate-100">Ready when you are</div>
            <div className="mt-1">
              Click the button below to ask the AI for professional rephrases
              of every redline currently in this document.
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Play className="h-3 w-3" /> Generate suggestions
            </button>
          </div>
        )}

        {status === "empty" && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-slate-100">No redlines to polish</div>
            <div className="mt-1">
              This document doesn&apos;t contain any insertion or deletion
              redlines yet. Use the <span className="font-semibold">+</span> /{" "}
              <span className="font-semibold">−</span> buttons on the editor
              toolbar to mark redlines, then come back here.
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RotateCw className="h-3 w-3" /> Check again
            </button>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            No suggestions returned for the redlines in this document.
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <RotateCw className="h-3 w-3" /> Try again
            </button>
          </div>
        )}

        {status === "ready" &&
          items.map((item) => (
            <SuggestionCard
              key={item.redline.redlineId}
              item={item}
              onApprove={onApprove}
              onDismiss={onDismiss}
              onUndo={onUndo}
              onFocus={onFocus}
              isMyTurn={isMyTurn}
            />
          ))}
      </div>
    </div>
  );
};

export default AiSuggestionsPanel;
