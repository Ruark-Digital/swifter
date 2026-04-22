import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { Bot, User, CheckCircle2, Quote } from "lucide-react";
import "@/assets/highlight-github.css";

export interface ReferencedMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface MessageContainerProps {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  referencedMessage?: ReferencedMessage;
  className?: string;
}

const MessageContainer: React.FC<MessageContainerProps> = memo(({
  content,
  sender,
  timestamp,
  referencedMessage,
  className,
}) => {
  const isUser = sender === "user";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Memoize markdown components for performance
  const markdownComponents = useMemo(() => ({
    // Custom paragraph styling
    p: ({ children, ...props }: any) => (
      <p className="mt-0 mb-2 last:mb-0 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    
    // Custom heading styles
    h1: ({ children, ...props }: any) => (
      <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h3>
    ),

    // Custom list styles
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-2 space-y-1 ml-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-2 space-y-1 ml-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Custom code block styling
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      
      if (!inline && match) {
        return (
          <div className="relative mb-4">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                {match[1]}
              </span>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-b-lg overflow-x-auto border border-gray-200 dark:border-gray-700 border-t-0">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      
      return (
        <code
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Custom blockquote styling
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg"
        {...props}
      >
        <div className="text-gray-700 dark:text-gray-300 italic">
          {children}
        </div>
      </blockquote>
    ),

    // Custom table styling
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props}>
        {children}
      </td>
    ),

    // Custom link styling
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),

    // Custom horizontal rule
    hr: ({ ...props }: any) => (
      <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />
    ),

    // Custom strong/bold styling
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </strong>
    ),

    // Custom emphasis/italic styling
    em: ({ children, ...props }: any) => (
      <em className="italic text-gray-800 dark:text-gray-200" {...props}>
        {children}
      </em>
    ),
  }), []);

  // Render referenced message if present
  const renderReferencedMessage = () => {
    if (!referencedMessage) return null;

    const isReferencedUser = referencedMessage.sender === "user";

    return (
      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">
        <div className="flex items-start gap-2 mb-2">
          <Quote className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1">
              {isReferencedUser ? (
                <User className="h-3 w-3 text-green-600" />
              ) : (
                <Bot className="h-3 w-3 text-blue-600" />
              )}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {isReferencedUser ? "You" : "AI Assistant"}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatTime(referencedMessage.timestamp)}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {referencedMessage.content.length > 150
            ? `${referencedMessage.content.substring(0, 150)}...`
            : referencedMessage.content}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-900 rounded-bl-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        )}
      >
        {/* Referenced message */}
        {renderReferencedMessage()}

        {/* Main message content with markdown support */}
        <div 
          className={cn(
            "prose prose-sm max-w-none whitespace-normal leading-relaxed",
            isUser ? "prose-invert" : ""
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Message metadata */}
        <div
          className={cn(
            "flex items-center justify-between mt-2 text-xs opacity-70",
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <span>{formatTime(timestamp)}</span>
          {isUser && <CheckCircle2 className="h-3 w-3 ml-2" />}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
});

MessageContainer.displayName = "MessageContainer";

export default MessageContainer;