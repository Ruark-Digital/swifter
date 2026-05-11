import React from "react";
import { Sparkles, X, Check, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RedlineSpan } from "../collab/redlineScan";
import type { AiRedlineSuggestion } from "../collab/useAiRedlineSuggestions";

type Status = "idle" | "loading" | "ready" | "error";

type Item = {
  redline: RedlineSpan;
  suggestion?: AiRedlineSuggestion;
  state: "pending" | "approved" | "dismissed";
};

interface AiSuggestionsPanelProps {
  open: boolean;
  onClose: () => void;
  status: Status;
  errorMessage?: string;
  items: Item[];
  onApprove: (item: Item) => void;
  onDismiss: (item: Item) => void;
  onRetry: () => void;
}

const KindPill: React.FC<{ kind: RedlineSpan["kind"] }> = ({ kind }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      kind === "insertion"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700",
    )}
  >
    {kind}
  </span>
);

const AiSuggestionsPanel: React.FC<AiSuggestionsPanelProps> = ({
  open,
  onClose,
  status,
  errorMessage,
  items,
  onApprove,
  onDismiss,
  onRetry,
}) => {
  if (!open) return null;

  const remaining = items.filter((i) => i.state === "pending").length;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[420px] max-w-[90vw] flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <div>
            <div className="text-base font-semibold text-slate-900">
              AI Polish
            </div>
            <div className="text-xs text-slate-500">
              {status === "ready"
                ? `${remaining} suggestion${remaining === 1 ? "" : "s"} to review`
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
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RotateCw className="h-4 w-4 animate-spin" />
            Asking AI for professional rephrases…
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Click <span className="font-semibold">Generate</span> on the toolbar
            to ask the AI for professional rephrases of every redline in this
            document.
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No redlines found in the document.
          </div>
        )}

        {status === "ready" &&
          items.map((item) => {
            const isPending = item.state === "pending";
            return (
              <div
                key={item.redline.redlineId}
                className={cn(
                  "rounded-xl border p-3 transition-opacity",
                  isPending
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 opacity-70",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <KindPill kind={item.redline.kind} />
                  {!isPending && (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        item.state === "approved"
                          ? "text-green-600"
                          : "text-slate-500",
                      )}
                    >
                      {item.state === "approved" ? "Replaced" : "Dismissed"}
                    </span>
                  )}
                </div>

                <div className="mb-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  <div className="font-semibold text-slate-500">Original</div>
                  <div className="mt-1 line-clamp-3">{item.redline.text}</div>
                </div>

                {item.suggestion ? (
                  <>
                    <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-slate-800">
                      <div className="font-semibold text-indigo-700">
                        Suggested rephrase
                      </div>
                      <div className="mt-1">{item.suggestion.suggestion}</div>
                      {item.suggestion.rationale && (
                        <div className="mt-2 text-[11px] italic text-slate-500">
                          {item.suggestion.rationale}
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onDismiss(item)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Check className="h-3 w-3" /> Approve & replace
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs italic text-slate-500">
                    No suggestion returned for this redline.
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default AiSuggestionsPanel;
