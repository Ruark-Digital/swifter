import React from "react";

// Loading phases shared with IframeEditorPane. `ready` never renders this
// component (the pane hides it), but it's accepted for prop-type symmetry.
export type EditorLoadPhase = "connecting" | "fetching" | "rendering" | "ready" | "error";

type Props = {
  phase: EditorLoadPhase;
  errorMsg: string;
  /** When provided, the error state shows a "Try again" button that calls this
   *  to re-attempt the editor handshake. */
  onRetry?: () => void;
  /** False for a read-only preview, where no collaboration session is opened.
   *  Keeps the status line from promising live collaboration on a plain
   *  on-screen view (QA #286). */
  collaborative?: boolean;
};

const steps = (collaborative: boolean): { key: EditorLoadPhase; label: string }[] => [
  { key: "connecting", label: "Connecting to the editor" },
  { key: "fetching", label: "Downloading the document" },
  {
    key: "rendering",
    label: collaborative
      ? "Preparing the document and live collaboration"
      : "Preparing the document",
  },
];

const ORDER: Record<EditorLoadPhase, number> = {
  connecting: 0,
  fetching: 1,
  rendering: 2,
  ready: 3,
  error: -1,
};

const SkeletonLine: React.FC<{ w: string }> = ({ w }) => (
  <div
    className="h-3 rounded bg-slate-200 animate-pulse motion-reduce:animate-none dark:bg-slate-700"
    style={{ width: w }}
  />
);

const EditorLoadingSkeleton: React.FC<Props> = ({
  phase,
  errorMsg,
  onRetry,
  collaborative = true,
}) => {
  if (phase === "error") {
    // Opaque canvas (matches the loading state) so a failed/blank iframe never
    // bleeds through behind the card.
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6 dark:bg-slate-900">
        <div
          role="alert"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            We couldn&rsquo;t open the editor
          </h2>
          <p className="mx-auto mt-1.5 max-w-[280px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {errorMsg || "Something went wrong while loading the document. Please try again."}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:focus-visible:ring-indigo-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const active = ORDER[phase];
  const STEPS = steps(collaborative);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start overflow-hidden bg-slate-100 px-4 pt-10 dark:bg-slate-900">
      {/* Page-sheet skeleton — previews the real white document surface. */}
      <div
        data-testid="editor-skeleton-page"
        className="w-full max-w-[816px] rounded-sm bg-white p-[72px] shadow-lg dark:bg-slate-800"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkeletonLine w="55%" />
          <SkeletonLine w="35%" />
        </div>
        <div className="flex flex-col gap-3">
          {["100%", "96%", "98%", "60%", "100%", "92%", "100%", "48%"].map((w, i) => (
            <SkeletonLine key={`line-${i}`} w={w} />
          ))}
        </div>
      </div>

      {/* Quiet status line. */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 motion-reduce:animate-none dark:border-slate-600 dark:border-t-slate-300" />
        <span>
          {(STEPS.find((s) => s.key === phase) ?? STEPS[0]).label}…
        </span>
      </div>

      {/* Step dots. */}
      <div className="mt-3 flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={
              "h-1.5 w-6 rounded-full transition-colors " +
              (i <= active
                ? "bg-slate-400 dark:bg-slate-300"
                : "bg-slate-200 dark:bg-slate-700")
            }
          />
        ))}
      </div>
    </div>
  );
};

export default EditorLoadingSkeleton;
