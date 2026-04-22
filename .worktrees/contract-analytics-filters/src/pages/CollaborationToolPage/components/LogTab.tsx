import React, { useCallback } from "react";
import FeedItem from "./FeedItem";
import { type CommentsFeedItem } from "./CommentsTab";
import VirtualizedFeedList from "./VirtualizedFeedList";

type LogTabProps = {
  avatarPublic: string;
  logs: CommentsFeedItem[];
};

const areLogsEqual = (prev: CommentsFeedItem[], next: CommentsFeedItem[]) => {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const p = prev[i];
    const n = next[i];
    if (
      p.id !== n.id ||
      p.name !== n.name ||
      p.timestamp !== n.timestamp ||
      p.message !== n.message ||
      p.showDot !== n.showDot ||
      p.attachment?.filename !== n.attachment?.filename ||
      p.attachment?.size !== n.attachment?.size
    ) {
      return false;
    }
  }
  return true;
};

const LogTab: React.FC<LogTabProps> = ({ avatarPublic, logs }) => {
  const renderLogItem = useCallback(
    (log: CommentsFeedItem) => (
      <FeedItem
        avatarSrc={avatarPublic}
        name={log.name}
        timestamp={log.timestamp}
        message={log.message}
        attachment={log.attachment}
        showDot={log.showDot}
      />
    ),
    [avatarPublic],
  );

  return (
    <div className="ct-log-view my-5">
      <div className="ct-log-title">Log</div>
      <VirtualizedFeedList
        className="ct-feed mt-5"
        items={logs}
        itemHeight={96}
        getItemKey={(item) => item.id}
        renderItem={renderLogItem}
      />
    </div>
  );
};

const arePropsEqual = (prev: LogTabProps, next: LogTabProps) =>
  prev.avatarPublic === next.avatarPublic &&
  areLogsEqual(prev.logs, next.logs);

export default React.memo(LogTab, arePropsEqual);
