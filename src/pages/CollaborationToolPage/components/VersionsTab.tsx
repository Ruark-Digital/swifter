import React from "react";
import { RotateCcw, Save } from "lucide-react";
import type { Version } from "./VersionHistoryModal";

interface VersionsTabProps {
  versions: Version[];
  onSave: () => void;
  onRestore: (versionId: string) => void;
  canSave: boolean;
}

const VersionsTab: React.FC<VersionsTabProps> = ({
  versions,
  onSave,
  onRestore,
  canSave,
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Version history
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {versions.length === 0
              ? "No versions saved yet"
              : `${versions.length} saved version${versions.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center gap-1 rounded-md bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
          aria-label="Save current version"
        >
          <Save className="h-3.5 w-3.5" /> Save version
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            Click <span className="font-semibold">Save version</span> above to
            snapshot the current document. Restored versions overwrite the
            current document state.
          </div>
        ) : (
          <ul className="space-y-3">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded hover:border-gray-300 hover:shadow-sm transition-all dark:border-slate-800 dark:hover:border-slate-700"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                    {new Date(version.timestamp).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Saved by: {version.author}
                  </span>
                </div>
                <button
                  onClick={() => onRestore(version.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                  aria-label={`Restore version from ${new Date(version.timestamp).toLocaleString()}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VersionsTab;
