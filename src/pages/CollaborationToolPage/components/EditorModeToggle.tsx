import React from "react";
import { PencilLine, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export type EditableMode = "suggesting" | "editing";

interface EditorModeToggleProps {
  mode: EditableMode;
  onChange: (mode: EditableMode) => void;
}

const SEG =
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.96]";

/**
 * Suggest ⇄ Edit switch (Word/Docs style). In "suggesting" the user's edits
 * are recorded as tracked changes (reviewable redlines); in "editing" they
 * write the document directly (untracked). Shown only while the viewer can
 * actually edit — the read-only ("viewing") state has nothing to toggle.
 */
const EditorModeToggle: React.FC<EditorModeToggleProps> = ({
  mode,
  onChange,
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange("suggesting")}
              aria-pressed={mode === "suggesting"}
              className={cn(
                SEG,
                mode === "suggesting"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <PencilLine className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Suggest</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Suggest — your edits are tracked as reviewable changes
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange("editing")}
              aria-pressed={mode === "editing"}
              className={cn(
                SEG,
                mode === "editing"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Edit — write the document directly, without tracking changes
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default EditorModeToggle;
