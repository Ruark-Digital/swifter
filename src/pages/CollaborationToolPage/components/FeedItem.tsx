import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import "@/pages/CollaborationToolPage/collaboration.css";

interface Attachment {
  filename: string;
  size: string;
}

interface FeedItemProps {
  /** @deprecated retained for prop-shape compatibility; the avatar now
   *  renders initials derived from `name`. */
  avatarSrc?: string;
  name: string;
  timestamp: string;
  message: string;
  /** @deprecated retained for shape compatibility; the status dot no longer renders. */
  showDot?: boolean;
  attachment?: Attachment | null;
}

// Deterministic background colour per author so the same person always
// gets the same chip — same palette used by WriteComment's mention picker.
const AVATAR_TONES = [
  { bg: "#EEF2FF", fg: "#4338CA" }, // indigo
  { bg: "#ECFDF5", fg: "#047857" }, // emerald
  { bg: "#FEF3C7", fg: "#B45309" }, // amber
  { bg: "#FCE7F3", fg: "#BE185D" }, // pink
  { bg: "#E0F2FE", fg: "#0369A1" }, // sky
  { bg: "#F3E8FF", fg: "#7E22CE" }, // purple
];

const initialsOf = (name: string): string => {
  const parts = (name || "")
    .replace(/@.*/, "") // drop email domain if a raw email slipped in
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

const FeedItem: React.FC<FeedItemProps> = ({
  name,
  timestamp,
  message,
  attachment = null,
}) => {
  const initials = initialsOf(name);
  const tone = toneFor(name || "?");
  return (
    <div className="ct-feed-item">
      <div className="ct-avatar-wrap">
        <Avatar className="ct-avatar">
          <AvatarFallback
            style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="ct-feed-content">
        <div className="ct-feed-meta">
          <span className="ct-feed-name">{name}</span>
          <span className="ct-feed-time">{timestamp}</span>
        </div>
        <div className="ct-feed-message">{message}</div>
        {attachment && (
          <div className="ct-attachment">
            <div className="ct-attachment-icon">
              <img src="/assets/collaboration/file-02-icon.svg" alt="file" />
            </div>
            <div className="ct-attachment-text">
              <span className="ct-attachment-name">{attachment.filename}</span>
              <span className="ct-attachment-size">{attachment.size}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FeedItem);

