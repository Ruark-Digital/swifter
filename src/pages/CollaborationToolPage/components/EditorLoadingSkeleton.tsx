import React from "react";

// Loading phases shared with IframeEditorPane. `ready` never renders this
// component (the pane hides it), but it's accepted for prop-type symmetry.
export type EditorLoadPhase = "connecting" | "fetching" | "rendering" | "ready" | "error";

type Props = { phase: EditorLoadPhase; errorMsg: string };

const STEPS: { key: EditorLoadPhase; label: string }[] = [
  { key: "connecting", label: "Connecting to the editor" },
  { key: "fetching", label: "Downloading the document" },
  { key: "rendering", label: "Preparing the document and live collaboration" },
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

const EditorLoadingSkeleton: React.FC<Props> = ({ phase, errorMsg }) => {
  if (phase === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          role="alert"
          className="max-w-md rounded-lg border border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <p className="font-medium">We couldn't open the document</p>
          <p className="mt-1 opacity-90">{errorMsg || "Could not load the editor."}</p>
        </div>
      </div>
    );
  }

  const active = ORDER[phase];
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
            <SkeletonLine key={i} w={w} />
          ))}
        </div>
      </div>

      {/* Quiet status line. */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 motion-reduce:animate-none dark:border-slate-600 dark:border-t-slate-300" />
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
                ? "bg-slate-400 dark:bg-slate-400"
                : "bg-slate-200 dark:bg-slate-700")
            }
          />
        ))}
      </div>
    </div>
  );
};

export default EditorLoadingSkeleton;
