import React from 'react';
import { XIcon, RotateCcw } from 'lucide-react';

export interface Version {
  id: string;
  timestamp: string;
  author: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  onRestore: (versionId: string) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRestore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw] overflow-hidden transform transition-transform duration-300 scale-100 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          <h2 id="version-history-title" className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            Version History
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
            aria-label="Close Version History"
          >
            <XIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {versions.length === 0 ? (
            <div className="text-center text-gray-500 py-8 dark:text-slate-400">
              No version history available.
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

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end dark:border-slate-800 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
