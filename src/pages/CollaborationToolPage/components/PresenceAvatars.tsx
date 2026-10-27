import React from "react";
import type { PresenceUser } from "../collab/superdocBridge";
import { initialsOf, toneFor } from "./presenceAvatar";

// Avatars-only presence stack for the editor header (sits beside the Download
// button). `users` is the room's peers with the current user already excluded
// by the iframe relay, so we never render "self". When there are no other
// users, the component renders nothing — there is no "Only you" state.

type Props = { users: PresenceUser[] };

const MAX_VISIBLE = 4;

const PresenceAvatars: React.FC<Props> = ({ users }) => {
  if (users.length === 0) return null;

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, users.length - MAX_VISIBLE);

  return (
    <div className="flex -space-x-2" title={users.map((u) => u.name).join(", ")}>
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
  );
};

export default React.memo(PresenceAvatars);
