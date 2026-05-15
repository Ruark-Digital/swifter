import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Send, AtSign } from "lucide-react";
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

const initialsOf = (m: Mentionable): string => {
  const source = m.name || m.email || "";
  const parts = source
    .replace(/@.*/, "") // drop email domain when name is missing
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Deterministic background colour per mention so the same user always
// gets the same chip — pulled from a small palette of soft pastels.
const AVATAR_TONES = [
  { bg: "#EEF2FF", fg: "#4338CA" }, // indigo
  { bg: "#ECFDF5", fg: "#047857" }, // emerald
  { bg: "#FEF3C7", fg: "#B45309" }, // amber
  { bg: "#FCE7F3", fg: "#BE185D" }, // pink
  { bg: "#E0F2FE", fg: "#0369A1" }, // sky
  { bg: "#F3E8FF", fg: "#7E22CE" }, // purple
];
const toneFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const titleCase = (w: string) =>
  w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase();

// Pick the human-friendly name to insert in the comment body. If the
// API only returned an email (toMentionable falls back to email when
// name is missing), derive a display name from the local part.
const displayNameOf = (m: Mentionable): string => {
  const raw = (m.name ?? "").trim();
  if (!raw) return m.email || "";
  if (!EMAIL_RE.test(raw)) return raw;
  const local = raw.split("@")[0];
  const parts = local.split(/[._+\-]+/).filter(Boolean);
  if (parts.length === 0) return local;
  return parts.map(titleCase).join(" ");
};

// Build the highlighted preview rendered behind the textarea. Matches
// every `@<display-name>` against the names already tagged in this
// comment so we don't accidentally highlight stray `@words`.
const renderHighlighted = (
  text: string,
  tagged: Mentionable[],
): React.ReactNode[] => {
  if (tagged.length === 0 || text.length === 0) return [text];
  const names = Array.from(
    new Set(tagged.map((m) => displayNameOf(m)).filter(Boolean)),
  ).sort((a, b) => b.length - a.length);

  const out: React.ReactNode[] = [];
  let buffer = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "@") {
      let matched: string | null = null;
      for (const n of names) {
        if (text.slice(i + 1, i + 1 + n.length) === n) {
          matched = n;
          break;
        }
      }
      if (matched) {
        if (buffer) {
          out.push(buffer);
          buffer = "";
        }
        out.push(
          <span key={`m-${i}`} className="ct-mention-chip">
            @{matched}
          </span>,
        );
        i += 1 + matched.length;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }
  if (buffer) out.push(buffer);
  return out;
};

const WriteComment: React.FC<WriteCommentProps> = ({
  className,
  onChange,
  onSubmit,
  value,
  disabled = false,
  isSubmitting = false,
  mentionables = [],
  placeholder = "Write a Comment… use @ to tag",
}) => {
  const [internal, setInternal] = useState("");
  const val = value ?? internal;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [popRect, setPopRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const mentionsRef = useRef<Mentionable[]>([]);
  // When we replace a `@query` with `@DisplayName `, the caret must land
  // AFTER the trailing space. But applyChange() is async (it queues a
  // React state update), so calling setSelectionRange immediately —
  // even inside rAF — runs before the textarea's value has been
  // committed and clamps the position to the old length. We stash the
  // target offset here and a useEffect below applies it once `val`
  // updates and the textarea's DOM value matches.
  const pendingCaretRef = useRef<number | null>(null);

  useEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos == null) return;
    const input = inputRef.current;
    if (!input) return;
    pendingCaretRef.current = null;
    input.focus();
    try {
      input.setSelectionRange(pos, pos);
    } catch {
      // setSelectionRange can throw on some input types — safe to ignore.
    }
  }, [val]);

  // Track the wrap's screen position so the portal-rendered popover can
  // sit just below it. We recompute on open, on scroll and on resize.
  useLayoutEffect(() => {
    if (mentionQuery === null) {
      setPopRect(null);
      return;
    }
    const compute = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPopRect({
        top: r.bottom + 6,
        left: r.left,
        width: r.width,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [mentionQuery]);

  useEffect(() => {
    if (mentionQuery === null) return;
    const onDown = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (wrap.contains(e.target as Node)) return;
      // click outside both the input and the popover closes the picker
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-ct-mention-pop="true"]')) return;
      setMentionQuery(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mentionQuery]);

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
    const tagName = displayNameOf(m) || m.name;
    const replaced = before.replace(
      MENTION_TRIGGER,
      (_, lead) => `${lead}@${tagName} `,
    );
    const next = replaced + after;
    // Persist the actual mentionable (id, email, etc.) so the caller
    // gets the canonical record, but the rendered token uses display
    // name and the persisted mention's `name` is normalised for parity.
    mentionsRef.current = [
      ...mentionsRef.current.filter((x) => x.id !== m.id),
      { ...m, name: tagName },
    ];
    // Land the caret at the end of the full value so users continue typing
    // past any pre-existing trailing text.
    pendingCaretRef.current = next.length;
    applyChange(next);
    setMentionQuery(null);
  };

  const triggerMentionPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    const caret = input.selectionStart ?? val.length;
    const before = val.slice(0, caret);
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const insertion = `${needsLeadingSpace ? " " : ""}@`;
    const next = before + insertion + val.slice(caret);
    pendingCaretRef.current = caret + insertion.length;
    applyChange(next);
    setMentionQuery("");
    setActiveIndex(0);
  };

  const canSubmit = !disabled && !isSubmitting && val.trim().length > 0;

  return (
    <div ref={wrapRef} className={`ct-write-comment-wrap ${className ?? ""}`}>
      <div
        className={`ct-write-comment ${isFocused ? "ct-write-comment--focused" : ""} ${
          disabled ? "ct-write-comment--disabled" : ""
        }`}
      >
        <div className="ct-input-stack">
          <div className="ct-input-highlights" aria-hidden="true">
            {renderHighlighted(val, mentionsRef.current)}
            {/* trailing newline keeps the overlay's bounding box honest
                when the textarea ends with a line break */}
            {"​"}
          </div>
          <textarea
          ref={inputRef}
          aria-label="Write a Comment"
          placeholder={placeholder}
          value={val}
          disabled={disabled || isSubmitting}
          rows={1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            const next = e.target.value;
            applyChange(next);
            detectMention(next, e.target.selectionStart ?? next.length);
            // Auto-grow up to a cap
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
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
            if (!canSubmit) return;
            mentionsRef.current = [];
            onSubmit?.();
          }}
          className="ct-input ct-input--overlay"
        />
        </div>
        <div className="ct-write-comment__actions">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={triggerMentionPicker}
            disabled={disabled || isSubmitting}
            aria-label="Mention someone"
            title="Mention someone (@)"
            className="ct-icon-btn"
          >
            <AtSign className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canSubmit) return;
              mentionsRef.current = [];
              onSubmit?.();
            }}
            disabled={!canSubmit}
            aria-label="Send comment"
            title="Send (Enter)"
            className={`ct-send-btn ${canSubmit ? "ct-send-btn--active" : ""}`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mentionQuery !== null && popRect && createPortal(
        <div
          role="listbox"
          aria-label="Mention suggestions"
          data-ct-mention-pop="true"
          className="ct-mention-pop"
          style={{
            position: "fixed",
            top: popRect.top,
            left: popRect.left,
            width: popRect.width,
          }}
        >
          <div className="ct-mention-pop__header">
            <span className="ct-mention-pop__title">
              {mentionQuery ? `Tag “${mentionQuery}”` : "Tag someone"}
            </span>
            <span className="ct-mention-pop__hint">↑↓ to navigate · ↵ to insert</span>
          </div>
          {suggestions.length === 0 ? (
            <div className="ct-mention-pop__empty">
              No matches in this contract&apos;s team.
            </div>
          ) : (
            <ul className="ct-mention-pop__list">
              {suggestions.map((m, idx) => {
                const tone = toneFor(m.id);
                const initials = initialsOf(m);
                const displayName = m.name || m.email || "Unknown";
                const isEmailOnly = !m.name && m.email;
                return (
                  <li
                    key={m.id}
                    role="option"
                    aria-selected={idx === activeIndex}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(m);
                    }}
                    className={`ct-mention-pop__item ${
                      idx === activeIndex ? "ct-mention-pop__item--active" : ""
                    }`}
                  >
                    <span
                      className="ct-mention-pop__avatar"
                      style={{ background: tone.bg, color: tone.fg }}
                      aria-hidden
                    >
                      {initials}
                    </span>
                    <span className="ct-mention-pop__body">
                      <span className="ct-mention-pop__name">
                        {isEmailOnly ? m.email : displayName}
                      </span>
                      {!isEmailOnly && m.email && (
                        <span className="ct-mention-pop__sub">{m.email}</span>
                      )}
                      {m.role && (
                        <span className="ct-mention-pop__role">{m.role}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default WriteComment;
