import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  X,
  Minimize2,
  Expand,
  Shrink,
  RotateCcw,
  Paperclip,
  File,
  Image,
  FileText,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIChat, Message } from "@/hooks/useAIChat";
import MessageContainer from "./components/MessageContainer";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file: File;
}

interface AIChatWidgetProps {
  onSendMessage?: (message: string) => Promise<string>;
  onStreamMessage?: (
    message: string,
    onDelta: (partial: string) => void,
    onTool?: (phase: "start" | "end", tool: string) => void
  ) => Promise<void>;
  onReset?: () => Promise<void>;
  apiEndpoint?: string;
  className?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  theme?: "light" | "dark" | "auto";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showTypingIndicator?: boolean;
  enableSoundNotifications?: boolean;
  placeholder?: string;
  welcomeMessage?: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize my active contracts",
  "Show my open solicitations",
  "What's awaiting my evaluation?",
];

const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  onSendMessage,
  onStreamMessage,
  onReset,
  apiEndpoint,
  className,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedFileTypes = ["image/*", "text/*", ".pdf", ".doc", ".docx", ".txt"],
  // theme = "auto",
  position = "bottom-right",
  showTypingIndicator = true,
  // enableSoundNotifications = false,
  placeholder = "Type your message...",
  welcomeMessage = "Hello! How can I help you today?",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  // const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
  //   {}
  // );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use the AI chat hook for state management
  const {
    messages: hookMessages,
    isLoading: hookIsLoading,
    sendMessage: hookSendMessage,
    clearMessages: hookClearMessages,
  } = useAIChat({
    apiEndpoint,
    onError: (error) => {
      console.error("AI Chat Widget Error:", error);
    },
  });

  // Custom state management when using external onSendMessage/onStreamMessage
  const [customMessages, setCustomMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi — I'm the SwiftPro Assistant. Ask me about your contracts, solicitations, or evaluations.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [customIsLoading, setCustomIsLoading] = useState(false);

  // Use custom state when streaming or custom handler is provided, otherwise use hook state
  const useCustom = Boolean(onSendMessage || onStreamMessage);
  const messages = useCustom ? customMessages : hookMessages;
  const isLoading = useCustom ? customIsLoading : hookIsLoading;
  const sendMessage = useCustom ? undefined : hookSendMessage;
  const clearMessages = useCustom
    ? async () => {
        try {
          if (onReset) await onReset();
          setCustomMessages([
            {
              id: "1",
              content:
                "Hi — I'm the SwiftPro Assistant. Ask me about your contracts, solicitations, or evaluations.",
              sender: "ai",
              timestamp: new Date(),
            },
          ]);
          setActiveTools([]);
        } catch (error) {
          console.error("AI Chat reset failed:", error);
        }
      }
    : hookClearMessages;

  const hasUserMessage = messages.some((m) => m.sender === "user");

  // Position classes mapping
  const positionClasses = useMemo(() => {
    const positions = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
    };
    return positions[position];
  }, [position]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use a small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  // Auto-scroll when loading state changes
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Typing indicator simulation.
  // Tradeoff: this effect intentionally mirrors `isLoading`/`showTypingIndicator`
  // into `isTyping` state, which trips react-doctor/no-adjust-state-on-prop-change.
  // The semantics ("show while loading, auto-hide after 3s even if still loading,
  // hide when loading stops") need a timer-driven transition that can't be purely
  // derived during render — every alternative we tried (Pattern A discriminator,
  // ref+forceRender, child key-reset) ends up calling setState in another effect
  // and tripping the same rule. Documented FP; revisit if the rule learns the
  // timer-handoff pattern.
  useEffect(() => {
    if (isLoading && showTypingIndicator) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isLoading, showTypingIndicator]);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: FileAttachment[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > maxFileSize) {
          errors.push(
            `${file.name} is too large (max ${Math.round(
              maxFileSize / 1024 / 1024
            )}MB)`
          );
          return;
        }

        // Check file type
        const isAllowedType = allowedFileTypes.some((type) => {
          if (type.includes("*")) {
            return file.type.startsWith(type.replace("*", ""));
          }
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        });

        if (!isAllowedType) {
          errors.push(`${file.name} is not a supported file type`);
          return;
        }

        const fileAttachment: FileAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          url: URL.createObjectURL(file),
        };
        newFiles.push(fileAttachment);
      });

      if (errors.length > 0) {
        console.warn("File upload errors:", errors.join(", "));
        // You could show a toast notification here
      }

      setAttachedFiles((prev) => [...prev, ...newFiles]);
    },
    [maxFileSize, allowedFileTypes]
  );

  const handleFileRemove = useCallback((fileId: string) => {
    setAttachedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      const removedFile = prev.find((f) => f.id === fileId);
      if (removedFile?.url) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleSendMessage = async (overrideText?: string) => {
    const baseText = overrideText ?? inputValue;
    if ((!baseText.trim() && attachedFiles.length === 0) || isLoading) return;

    const messageContent = baseText.trim();
    // const filesToSend = [...attachedFiles];
    if (overrideText === undefined) setInputValue("");
    setAttachedFiles([]);

    try {
      if (onStreamMessage) {
        // Add user message to custom state
        const userMessage = {
          id: crypto.randomUUID(),
          content: messageContent,
          sender: "user" as const,
          timestamp: new Date(),
        };

        setCustomMessages((prev) => [...prev, userMessage]);
        setCustomIsLoading(true);

        // Create placeholder AI message and stream deltas into it
        const aiMessageId = crypto.randomUUID();
        setCustomMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            content: "",
            sender: "ai" as const,
            timestamp: new Date(),
          },
        ]);

        try {
          await onStreamMessage(
            messageContent,
            (partial) => {
              setCustomMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: m.content + partial } : m
                )
              );
            },
            (phase, tool) => {
              setActiveTools((prev) =>
                phase === "start"
                  ? [...prev, tool]
                  : prev.filter((t) => t !== tool)
              );
            }
          );
        } catch (error) {
          console.error("Streaming error:", error);
          // Replace the empty placeholder with a clear error message
          setCustomMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? {
                    ...m,
                    content:
                      "Sorry, I couldn't process your request right now. Please try again.",
                  }
                : m
            )
          );
          // Stop further error propagation to avoid duplicate error messages
          return;
        } finally {
          setCustomIsLoading(false);
          setActiveTools([]);
        }
      } else if (onSendMessage) {
        // Add user message to custom state
        const userMessage = {
          id: crypto.randomUUID(),
          content: messageContent,
          sender: "user" as const,
          timestamp: new Date(),
        };

        setCustomMessages((prev) => [...prev, userMessage]);
        setCustomIsLoading(true);

        try {
          // Get AI response using custom handler
          const aiResponse = await onSendMessage(messageContent);

          // Add AI response to custom state
          if (aiResponse) {
            const aiMessage = {
              id: crypto.randomUUID(),
              content: aiResponse,
              sender: "ai" as const,
              timestamp: new Date(),
            };

            setCustomMessages((prev) => [...prev, aiMessage]);
          }
        } finally {
          setCustomIsLoading(false);
        }
      } else {
        // Use hook's sendMessage for default behavior
        if (sendMessage) {
          await sendMessage(messageContent);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      if (useCustom) {
        // Add error message to custom state
        const errorMessage = {
          id: crypto.randomUUID(),
          content:
            "Sorry, I encountered an error while processing your message. Please try again.",
          sender: "ai" as const,
          timestamp: new Date(),
        };

        setCustomMessages((prev) => [...prev, errorMessage]);
        setCustomIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith("image/"))
      return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType.includes("text") || fileType.includes("document"))
      return <FileText className="h-4 w-4 text-green-500" />;
    if (fileType.includes("pdf"))
      return <File className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  }, []);

  const getFileTypeColor = useCallback((fileType: string) => {
    if (fileType.startsWith("image/")) return "bg-blue-50 border-blue-200";
    if (fileType.includes("text") || fileType.includes("document"))
      return "bg-green-50 border-green-200";
    if (fileType.includes("pdf")) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  }, [isOpen]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Enhanced message rendering with MessageContainer
  const renderMessage = useCallback((message: Message) => {
    return (
      <MessageContainer
        key={message.id}
        id={message.id}
        content={message.content}
        sender={message.sender}
        timestamp={message.timestamp}
        referencedMessage={message.referencedMessage}
      />
    );
  }, []);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed z-50 transition-all duration-300",
          positionClasses,
          className
        )}
      >
        {/* Chat Toggle Button */}
        {!isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleChat}
                className="group relative flex items-center justify-center rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#07004D]/25"
                aria-label="Open SwiftPro Assistant"
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07004D] font-quicksand text-2xl font-bold text-white shadow-lg shadow-[#07004D]/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-[#07004D]/40">
                  S
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60"></span>
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </span>
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="border-[#07004D] bg-[#07004D] text-white"
            >
              <p>Ask the SwiftPro Assistant</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card
            ref={chatContainerRef}
            className={cn(
              "shadow-2xl transition-all duration-300 ease-in-out border-0 backdrop-blur-sm",
              isMinimized ? "h-14" : "h-[650px]",
              isDragOver &&
                "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50/50",
              isExpanded
                ? "w-[90vw] sm:w-[85vw] md:w-[50vw]"
                : "w-96 sm:w-[85vw] md:w-[420px]"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Chat Header */}
            <CardHeader className="p-4 bg-[#07004D] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-quicksand text-lg font-bold ring-1 ring-white/15">
                    S
                  </div>
                  <div>
                    <CardTitle className="font-quicksand text-base font-semibold tracking-tight">
                      SwiftPro Assistant
                    </CardTitle>
                    {activeTools.length > 0 ? (
                      <p className="flex items-center gap-1.5 text-xs text-violet-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span>
                        Consulting {activeTools.join(", ")}…
                      </p>
                    ) : isTyping ? (
                      <p className="flex items-center gap-1.5 text-xs text-violet-200">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span>
                        Typing…
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-white/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        Online
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleExpand}
                        className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                      >
                        {isExpanded ? (
                          <Shrink className="h-4 w-4" />
                        ) : (
                          <Expand className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isExpanded ? "Collapse width" : "Expand to 50%"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearMessages}
                        className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                        disabled={messages.length === 0}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear conversation</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={minimizeChat}
                        className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Minimize</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeChat}
                        className="h-8 w-8 text-white hover:bg-white/20 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close chat</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>

            {/* Chat Content */}
            {!isMinimized && (
              <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Welcome to AI Assistant
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                          {welcomeMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages Area */}
                {messages.length > 0 && (
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 h-[10rem]">
                      {messages
                        .filter(message => !isLoading || message.content.trim() !== '')
                        .map(renderMessage)}
                      {isLoading && (
                        <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#07004D] font-quicksand text-sm font-bold text-white">
                            S
                          </div>
                          <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-[#07004D]/50 [animation-delay:-0.3s] dark:bg-violet-400"></span>
                              <span className="h-2 w-2 animate-bounce rounded-full bg-[#07004D]/50 [animation-delay:-0.15s] dark:bg-violet-400"></span>
                              <span className="h-2 w-2 animate-bounce rounded-full bg-[#07004D]/50 dark:bg-violet-400"></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-1" />
                    </div>
                  </ScrollArea>
                )}

                {/* Loading overlay when no messages exist */}
                {isLoading && messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Processing your message...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Attachments */}
                {attachedFiles.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attachments ({attachedFiles.length})
                        </span>
                      </div>
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                            getFileTypeColor(file.type)
                          )}
                        >
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0"
                              >
                                {file.type.split("/")[0] || "file"}
                              </Badge>
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFileRemove(file.id)}
                                className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove file</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested prompts (before the first question) */}
                {!hasUserMessage && !isLoading && attachedFiles.length === 0 && (
                  <div className="px-4 pb-1 pt-3">
                    <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#07004D] transition-colors hover:border-[#07004D]/30 hover:bg-[#07004D]/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {isDragOver && (
                    <div className="mb-3 p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Paperclip className="h-6 w-6 text-blue-500" />
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Drop files here to attach
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={placeholder}
                        disabled={isLoading}
                        rows={1}
                        className="w-full min-h-[44px] max-h-[120px] resize-none pr-12 py-3 px-4 border border-slate-300 focus:border-[#07004D] rounded-xl bg-white dark:bg-slate-800 dark:border-slate-600 dark:focus:border-violet-400 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07004D]/20 dark:focus-visible:ring-violet-400/30 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto transition-all duration-200"
                        style={{
                          height: "auto",
                          minHeight: "44px",
                          maxHeight: "120px",
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height =
                            Math.min(target.scrollHeight, 120) + "px";
                        }}
                      />
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleSendMessage()}
                          disabled={
                            (!inputValue.trim() &&
                              attachedFiles.length === 0) ||
                            isLoading
                          }
                          size="icon"
                          className="bg-[#07004D] hover:bg-[#0a0668] disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-xl h-11 w-11 shadow-md shadow-[#07004D]/20 hover:shadow-lg transition-all duration-200 disabled:shadow-none"
                        >
                          <Send className="h-5 w-5 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {isLoading ? "Sending..." : "Send message (Enter)"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedFileTypes.join(",")}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AIChatWidget;
