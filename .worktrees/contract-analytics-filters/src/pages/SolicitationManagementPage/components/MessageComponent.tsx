import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Question } from "./QuestionsTab";
import { useUserRole } from "@/hooks/useUserRole";

type User = Question["user"];

interface Reply {
  id: string;
  note: string;
  createdAt: string;
  respondent: User;
  replies?: Reply[];
}

interface MessageComponentProps {
  id: string;
  note: string;
  createdAt: string;
  user: User;
  replies?: Reply[];
  isQuestion?: boolean;
  onReply?: (messageId: string, type: "reply" | "addendum") => void;
  showReplyButtons?: boolean;
  depth?: number;
  sendType: "reply" | "addendum" | null;
  solicitationStatus?: string;
}

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  // const date = new Date(dateString);
  // const formattedDate = date.toISOString().split("T")[0];
  const formattedDate = dateString?.split("T")?.[0] || "";
  const formattedTime = dateString?.split("T")?.[1]?.split(".")?.[0] || "N/A";
  return { date: formattedDate, time: formattedTime };
};

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const MessageComponent: React.FC<MessageComponentProps> = ({
  id,
  note,
  createdAt,
  user,
  replies = [],
  isQuestion = false,
  onReply,
  showReplyButtons = false,
  depth = 0,
  sendType,
  solicitationStatus,
}) => {
  const [isClicked, setIsClicked] = useState<string | null>(null);
  const { date, time } = formatDateTime(createdAt);
  const { isVendor } = useUserRole();
  const maxDepth = 3; // Limit nesting depth

  return (
    <div
      className={`${
        depth > 0
          ? "ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
          : ""
      }`}
    >
      {/* Message Header */}
      <MessageHeader
        user={user}
        isQuestion={isQuestion}
        date={date}
        time={time}
      />

      {/* Message Content */}
      <div
        className="text-gray-900 dark:text-gray-200 mb-4 prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: note }}
      />

      {/* Reply Buttons */}
      {showReplyButtons && onReply && (
        <div className="flex justify-end gap-2 mb-4">
          {!isVendor && (
            <Button
              variant={
                sendType === "addendum" && isClicked === id
                  ? "default"
                  : "outline"
              }
              size="sm"
              disabled={
                solicitationStatus === "closed" ||
                solicitationStatus === "awarded"
              }
              className={
                solicitationStatus === "closed" ||
                solicitationStatus === "awarded"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
              onClick={() => {
                setIsClicked(id);
                onReply(id, "addendum");
              }}
            >
              Respond With Addendum
            </Button>
          )}
          <Button
            size="sm"
            variant={
              sendType === "reply" && isClicked === id ? "default" : "outline"
            }
            onClick={() => {
              setIsClicked(id);
              onReply(id, "reply");
            }}
          >
            Reply
          </Button>
        </div>
      )}

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <MessageComponent
              key={reply.id}
              id={reply.id}
              note={reply.note}
              createdAt={reply.createdAt}
              sendType={sendType}
              user={reply.respondent}
              replies={reply.replies}
              onReply={depth < maxDepth ? onReply : undefined}
              showReplyButtons={depth < maxDepth && !!onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;

const MessageHeader = ({
  user,
  isQuestion,
  date,
  time,
}: {
  user: User;
  isQuestion: boolean;
  date: string;
  time: string;
}) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Avatar className="h-14 w-14">
        <AvatarImage src={user?.avatar} alt={user?.name ?? ""} />
        <AvatarFallback className="text-xs">
          {getInitials(user?.name ?? "")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-200">
            {user?.name}
          </span>
          <span className="text-gray-400">-</span>
          <span className="text-sm text-gray-500">
            {user?.role?.name || (isQuestion ? "Vendor" : "Procurement Lead")}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {date} • {time}
        </div>
      </div>
    </div>
  );
};
