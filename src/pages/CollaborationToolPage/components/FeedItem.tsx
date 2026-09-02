import React from "react";
import { ArrowUpRight, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";

interface Attachment {
  filename: string;
  size: string;
}

interface FeedItemProps {
  avatarSrc: string;
  name: string;
  timestamp: string;
  message: string;
  showDot?: boolean;
  attachment?: Attachment | null;
  /** When true, the row is a button that locates the comment in the document. */
  interactive?: boolean;
  /** Highlights the row as the currently-focused comment. */
  isActive?: boolean;
  onSelect?: () => void;
}

/** First glyph of a name, upper-cased; falls back to a neutral dot. */
function initial(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : "•";
}

const FeedItem: React.FC<FeedItemProps> = ({
  avatarSrc,
  name,
  timestamp,
  message,
  showDot = true,
  attachment = null,
  interactive = false,
  isActive = false,
  onSelect,
}) => {
  const hasAttachment = Boolean(attachment);

  const body = (
    <>
      <div className="ct-avatar-wrap">
        <Avatar className="ct-avatar">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback>{initial(name)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="ct-feed-content">
        <div className="ct-feed-meta">
          <span className="ct-feed-name">{name}</span>
          <span className="ct-feed-dot-sep" aria-hidden="true">
            &middot;
          </span>
          <span className="ct-feed-time">{timestamp}</span>
          {showDot && <span aria-label="unread" className="ct-status-dot" />}
        </div>
        <p className={cn("ct-feed-message", hasAttachment && "ct-feed-message--tight")}>
          {message}
        </p>
        {attachment && (
          <div className="ct-attachment">
            <span className="ct-attachment-icon">
              <Paperclip size={14} strokeWidth={2} />
            </span>
            <span className="ct-attachment-text">
              <span className="ct-attachment-name">{attachment.filename}</span>
              <span className="ct-attachment-size">{attachment.size}</span>
            </span>
          </div>
        )}
      </div>
      {interactive && (
        <span className="ct-feed-locate" aria-hidden="true">
          <ArrowUpRight size={15} strokeWidth={2.25} />
        </span>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isActive}
        aria-label={`Go to comment by ${name}`}
        className={cn("ct-feed-item ct-feed-item--interactive", isActive && "is-active")}
      >
        {body}
      </button>
    );
  }

  return <div className="ct-feed-item">{body}</div>;
};

export default React.memo(FeedItem);
