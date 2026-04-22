import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type your message...',
  className,
  disabled = false,
  minHeight = '120px',
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const isSettingRef = useRef(false);

  const toolbarOptions = useMemo(
    () => [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
    []
  );

  const formats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'],
    []
  );

  // Initialize Quill
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const q = new Quill(editorRef.current, {
      theme: 'snow',
      readOnly: disabled,
      placeholder,
      modules: {
        toolbar: disabled ? false : toolbarOptions,
        clipboard: { matchVisual: false },
      },
      formats,
    });

    quillRef.current = q;

    // Set initial value
    if (value) {
      isSettingRef.current = true;
      q.clipboard.dangerouslyPasteHTML(value);
      // next tick to avoid firing change
      setTimeout(() => {
        isSettingRef.current = false;
      }, 0);
    }

    // Change handler -> emit HTML
    const handleChange = () => {
      if (isSettingRef.current) return;
      const html = q.root.innerHTML;
      onChange(html);
    };

    q.on('text-change', handleChange);

    return () => {
      q.off('text-change', handleChange);
      quillRef.current = null;
    };
    // We want to run only once on mount, toolbarOptions/formats are stable via useMemo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value -> editor
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;

    const current = q.root.innerHTML;
    if (value !== current) {
      isSettingRef.current = true;
      q.clipboard.dangerouslyPasteHTML(value || '');
      setTimeout(() => {
        isSettingRef.current = false;
      }, 0);
    }
  }, [value]);

  // Sync disabled (readOnly) state
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    q.enable(!disabled);
  }, [disabled]);

  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900',
        disabled && 'rt-disabled',
        className
      )}
    >
      {/* Quill mounts toolbar + editor inside this container */}
      <div ref={editorRef} className={cn('text-gray-900 dark:text-gray-100')} />

      <style>{`
        /* Quill styling overrides for light/dark themes and layout cohesion */
        .ql-toolbar {
          border: 1px solid #e2e8f0;
          border-bottom: none;
          border-radius: 0.5rem 0.5rem 0 0;
          background: #f8fafc;
        }
        .dark .ql-toolbar {
          border-color: #374151;
          background: #1f2937;
        }
        .ql-container {
          border: 1px solid #e2e8f0;
          border-radius: 0 0 0.5rem 0.5rem;
          font-family: inherit;
          background: #ffffff;
        }
        .dark .ql-container {
          border-color: #374151;
          background: #111827;
        }
        .ql-editor {
          min-height: ${minHeight};
          font-size: 14px;
          line-height: 1.5;
          color: inherit;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .dark .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        .ql-snow .ql-tooltip { z-index: 1000; }
        /* Hide toolbar visually when disabled to mirror previous behavior */
        .rt-disabled .ql-toolbar { display: none; }
        .rt-disabled .ql-container { border-radius: 0.5rem; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;