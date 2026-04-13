import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RichTextEditor from "@/components/layouts/FormInputs/RichTextEditor";
import { useUser } from "@/store/authSlice";
import { useUserRole } from "@/hooks/useUserRole";

interface MessageComposerProps {
  onSend: (content: string, type: "reply" | "addendum" | null) => void;
  isLoading?: boolean;
  replyToUser?: {
    name: string;
    avatar?: string;
  };
  availableUsers?: Array<{
    name: string;
    avatar?: string;
  }>;
  currentUser?: {
    name: string;
    avatar?: string;
  };
  sendType: "reply" | "addendum" | null;
  isNewChat: boolean;
  onSendTypeChange: (type: "reply" | "addendum") => void;
  disabled?: boolean;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isLoading = false,
  replyToUser,
  availableUsers,
  currentUser,
  sendType,
  isNewChat,
  disabled = false,
}) => {
  const { isProcurement } = useUserRole();
  const [content, setContent] = useState("");
  const [selectedReplyUser, setSelectedReplyUser] = useState(replyToUser);
  const user = useUser();

  React.useEffect(() => {
    setSelectedReplyUser(replyToUser);
  }, [replyToUser]);

  const displayUser = user
    ? {
        name: user.name,
        avatar: user.avatar,
      }
    : currentUser || { name: "You" };

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content, sendType);
    setContent("");
  };

  const isContentEmpty =
    !content.trim() ||
    content === "<p><br></p>" ||
    content === "<div><br></div>";

  return (
    <div className="rounded-lg">
      {/* Header */}
      {!isNewChat && sendType && (
        <div className="py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={displayUser.avatar} />
              <AvatarFallback className="text-lg">
                {getInitials(displayUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reply to:
              </span>
              {availableUsers && availableUsers.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-sm">
                      {selectedReplyUser?.name || "Select user"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {availableUsers.map((user, index) => (
                      <DropdownMenuItem
                        key={user.name + index}
                        onClick={() => setSelectedReplyUser(user)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {replyToUser?.name || ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="">
        {/* Rich Text Editor */}
        <div className="mb-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={disabled ? "You don't have permission to comment on this solicitation." : ""}
            minHeight="200px"
            disabled={isLoading || disabled}
          />
          {/* Character Count */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Character count: {content.replace(/<[^>]*>/g, "").length}
            </span>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={isLoading || isContentEmpty || disabled}
            className="px-6 py-2 rounded-md font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : isProcurement ? (
              "Send Response"
            ) : (
              "Send Question"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
