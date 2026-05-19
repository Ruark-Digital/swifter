import React, { useEffect, useMemo, useState } from "react";
import type { AwarenessEntry, CollabSyncState } from "../collab/useCollabProvider";

type SaveState = "offline" | "saving" | "saved" | "kicked";

type PresenceBarProps = {
  users: AwarenessEntry[];
  deviceCount: number | null;
  sync: CollabSyncState;
  /** Local dirty flag — true while local edits are pending a sync ack. */
  dirty: boolean;
  /** Epoch ms of the last successful sync (drives the relative "saved" label). */
  lastSavedAt: number | null;
};

const MAX_VISIBLE = 4;

const AVATAR_TONES = [
  { bg: "#EEF2FF", fg: "#4338CA" },
  { bg: "#ECFDF5", fg: "#047857" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#E0F2FE", fg: "#0369A1" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
];

const initialsOf = (name: string): string => {
  const parts = (name || "")
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const toneFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
};

const formatRelative = (ms: number): string => {
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
};

const deriveSaveState = (
  sync: CollabSyncState,
  dirty: boolean,
): SaveState => {
  if (sync.status === "kicked") return "kicked";
  if (sync.status !== "connected") return "offline";
  if (dirty || !sync.synced) return "saving";
  return "saved";
};

const PresenceBar: React.FC<PresenceBarProps> = ({
  users,
  deviceCount,
  sync,
  dirty,
  lastSavedAt,
}) => {
  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, users.length - MAX_VISIBLE);
  const saveState = deriveSaveState(sync, dirty);

  // Recompute the "x ago" label periodically so it stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (saveState !== "saved") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [saveState]);

  const fallbackCount = useMemo(() => {
    if (users.length > 0) return null;
    if (deviceCount == null || deviceCount <= 0) return null;
    return deviceCount;
  }, [users.length, deviceCount]);

  return (
    <div className="ct-presence-bar flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
      <div className="flex items-center gap-2">
        {visible.length === 0 && fallbackCount != null && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {fallbackCount} {fallbackCount === 1 ? "device" : "devices"} connected
          </span>
        )}
        {visible.length === 0 && fallbackCount == null && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Only you
          </span>
        )}
        <div className="flex -space-x-2">
          {visible.map((entry) => {
            const tone = toneFor(entry.user.name || String(entry.clientId));
            const initials = initialsOf(entry.user.name);
            return (
              <div
                key={entry.clientId}
                title={entry.user.name}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 text-[10px] font-semibold shadow-sm"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {entry.user.avatarUrl ? (
                  <img
                    src={entry.user.avatarUrl}
                    alt={entry.user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            );
          })}
          {overflow > 0 && (
            <div
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
              title={users
                .slice(MAX_VISIBLE)
                .map((u) => u.user.name)
                .join(", ")}
            >
              +{overflow}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {saveState === "offline" && (
          <>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">Offline</span>
          </>
        )}
        {saveState === "saving" && (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Saving…</span>
          </>
        )}
        {saveState === "saved" && (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">
              Saved{lastSavedAt ? ` · ${formatRelative(lastSavedAt)}` : ""}
            </span>
          </>
        )}
        {saveState === "kicked" && (
          <>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span
              className="text-rose-600 dark:text-rose-300"
              title="Another tab from the same browser is editing this document. Close that tab to resume here."
            >
              Open in another tab
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(PresenceBar);
