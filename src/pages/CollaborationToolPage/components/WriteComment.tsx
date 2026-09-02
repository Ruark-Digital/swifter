import React, { useState } from "react";
import { AtSign, Loader2, SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import "@/pages/CollaborationToolPage/collaboration.css";

interface WriteCommentProps {
  className?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  value?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
}

const WriteComment: React.FC<WriteCommentProps> = ({
  className,
  onChange,
  onSubmit,
  value,
  disabled = false,
  isSubmitting = false,
}) => {
  const [internal, setInternal] = useState("");
  const val = value ?? internal;
  const locked = disabled || isSubmitting;
  const canSend = !locked && val.trim().length > 0;

  return (
    <div className={cn("ct-write-comment", locked && "is-disabled", className)}>
      <span className="ct-write-lead" aria-hidden="true">
        <AtSign size={16} strokeWidth={2} />
      </span>
      <Input
        aria-label="Write a comment"
        placeholder={disabled ? "Comments are read-only" : "Write a comment, use @ to tag"}
        value={val}
        disabled={locked}
        onChange={(e) => {
          setInternal(e.target.value);
          onChange?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          if (canSend) onSubmit?.();
        }}
        className="ct-input border-0 focus-visible:ring-0 shadow-none bg-transparent h-12 px-0"
      />
      <button
        type="button"
        className="ct-write-send"
        onClick={() => canSend && onSubmit?.()}
        disabled={!canSend}
        aria-label="Send comment"
      >
        {isSubmitting ? (
          <Loader2 size={16} strokeWidth={2.25} className="ct-spin" />
        ) : (
          <SendHorizontal size={16} strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
};

export default WriteComment;
