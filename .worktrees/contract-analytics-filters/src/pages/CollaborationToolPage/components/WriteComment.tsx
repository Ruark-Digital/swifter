import React, { useState } from "react";
import { Input } from "@/components/ui/input";
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

  return (
    <div className={`ct-write-comment ${className ?? ""}`}>
      <Input
        aria-label="Write a Comment"
        placeholder="Write a Comment"
        value={val}
        disabled={disabled || isSubmitting}
        onChange={(e) => {
          setInternal(e.target.value);
          onChange?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          onSubmit?.();
        }}
        className="ct-input border-0 focus-visible:ring-0 shadow-none bg-transparent h-[56px] px-0"
      />
    </div>
  );
};

export default WriteComment;
