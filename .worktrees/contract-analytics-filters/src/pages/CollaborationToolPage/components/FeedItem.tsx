import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

const FeedItem: React.FC<FeedItemProps> = ({
  avatarSrc,
  name,
  timestamp,
  message,
  showDot = true,
  attachment = null,
}) => {
  return (
    <div className="ct-feed-item">
      <div className="ct-avatar-wrap">
        <Avatar className="ct-avatar">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
      </div>
      <div className="ct-feed-content">
        <div className="ct-feed-meta">
          <span className="ct-feed-name">{name}</span>
          <span className="ct-feed-time">{timestamp}</span>
          {showDot && (
            <span aria-label="online" className="ct-status-dot" />
          )}
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

