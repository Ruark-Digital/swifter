import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Mentionable } from "../collab/useContractMentionables";
import "@/pages/CollaborationToolPage/collaboration.css";

interface WriteCommentProps {
  className?: string;
  onChange?: (value: string, mentions: Mentionable[]) => void;
  onSubmit?: () => void;
  value?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  mentionables?: Mentionable[];
  placeholder?: string;
}

const MENTION_TRIGGER = /(^|\s)@([\w\-.]*)$/;

const WriteComment: React.FC<WriteCommentProps> = ({
  className,
  onChange,
  onSubmit,
  value,
  disabled = false,
  isSubmitting = false,
  mentionables = [],
  placeholder = "Write a Comment",
}) => {
  const [internal, setInternal] = useState("");
  const val = value ?? internal;
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const mentionsRef = useRef<Mentionable[]>([]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentionables
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email ?? "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [mentionQuery, mentionables]);

  const detectMention = (text: string, caretPos: number) => {
    const before = text.slice(0, caretPos);
    const match = before.match(MENTION_TRIGGER);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(match[2]);
    setActiveIndex(0);
  };

  const applyChange = (next: string) => {
    setInternal(next);
    onChange?.(next, mentionsRef.current);
  };

  const insertMention = (m: Mentionable) => {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? val.length;
    const before = val.slice(0, caret);
    const after = val.slice(caret);
    const replaced = before.replace(MENTION_TRIGGER, (_, lead) => `${lead}@${m.name} `);
    const next = replaced + after;
    mentionsRef.current = [
      ...mentionsRef.current.filter((x) => x.id !== m.id),
      m,
    ];
    applyChange(next);
    setMentionQuery(null);
    // restore focus + caret position after the inserted mention
    window.requestAnimationFrame(() => {
      const pos = replaced.length;
      input?.focus();
      input?.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className={`ct-write-comment relative ${className ?? ""}`}>
      <Input
        ref={inputRef}
        aria-label="Write a Comment"
        placeholder={placeholder}
        value={val}
        disabled={disabled || isSubmitting}
        onChange={(e) => {
          const next = e.target.value;
          applyChange(next);
          detectMention(next, e.target.selectionStart ?? next.length);
        }}
        onKeyDown={(e) => {
          if (mentionQuery !== null && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % suggestions.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex(
                (i) => (i - 1 + suggestions.length) % suggestions.length,
              );
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insertMention(suggestions[activeIndex]);
              return;
            }
            if (e.key === "Escape") {
              setMentionQuery(null);
              return;
            }
          }
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          // reset mention state for next round
          mentionsRef.current = [];
          onSubmit?.();
        }}
        className="ct-input border-0 focus-visible:ring-0 shadow-none bg-transparent h-[56px] px-0"
      />
      {mentionQuery !== null && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 mb-1 w-72 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg z-50"
        >
          {suggestions.map((m, idx) => (
            <li
              key={m.id}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              className={`px-3 py-2 cursor-pointer text-sm ${
                idx === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="font-medium text-slate-900">{m.name}</div>
              {m.email && (
                <div className="text-xs text-slate-500">{m.email}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WriteComment;
