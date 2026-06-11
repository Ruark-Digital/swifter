import React from "react";
import type { PresenceUser } from "../collab/superdocBridge";
import { initialsOf, toneFor } from "./presenceAvatar";

// Avatars-only presence indicator for the SuperDoc iframe editor. Unlike the
// full PresenceBar (used by the legacy editors) there's no save-state pill —
// the iframe owns persistence, so the host has no sync/dirty signal to show.
// `users` is the room's peers (self already excluded by the iframe relay).

type Props = { users: PresenceUser[] };

const MAX_VISIBLE = 4;

const IframePresenceBar: React.FC<Props> = ({ users }) => {
  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, users.length - MAX_VISIBLE);

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white/60 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      {users.length === 0 ? (
        <span className="text-xs text-slate-400 dark:text-slate-500">Only you</span>
      ) : (
        <>
          <div className="flex -space-x-2">
            {visible.map((u) => {
              const tone = toneFor(u.name || String(u.clientId));
              return (
                <div
                  key={u.clientId}
                  title={u.name}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold shadow-sm dark:border-slate-900"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initialsOf(u.name)
                  )}
                </div>
              );
            })}
            {overflow > 0 && (
              <div
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-700 shadow-sm dark:border-slate-900 dark:bg-slate-700 dark:text-slate-200"
                title={users
                  .slice(MAX_VISIBLE)
                  .map((u) => u.name)
                  .join(", ")}
              >
                +{overflow}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {users.length} {users.length === 1 ? "other" : "others"} in the room
          </span>
        </>
      )}
    </div>
  );
};

export default React.memo(IframePresenceBar);
