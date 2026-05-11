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
  MessageCircle,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIChat, Message } from "@/hooks/useAIChat";
import MessageContainer from "./components/MessageContainer";
import axios from "axios";
import { useToken } from "@/store/authSlice";

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
    onDelta: (partial: string) => void
  ) => Promise<void>;
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

const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  onSendMessage,
  onStreamMessage,
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
  // const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
  //   {}
  // );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const token = useToken();

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
      content: "Hello! I'm your AI assistant. How can I help you today?",
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
          await axios.post("https://dev.swiftpro.tech/reset", undefined, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setCustomMessages([
            {
              id: "1",
              content:
                "Hello! I'm your AI assistant. How can I help you today?",
              sender: "ai",
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error("AI Chat reset failed:", error);
        }
      }
    : hookClearMessages;

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

  // Typing indicator simulation
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

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const messageContent = inputValue.trim();
    // const filesToSend = [...attachedFiles];
    setInputValue("");
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
          await onStreamMessage(messageContent, (partial) => {
            setCustomMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: m.content + partial } : m
              )
            );
          });
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
                className="relative group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                aria-label="Open AI Chat"
              >
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center hover:from-blue-700 hover:to-purple-800 transition-all duration-300">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-gray-900 text-white border-gray-700"
            >
              <p>Chat with AI Assistant</p>
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
            <CardHeader className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      AI Assistant
                    </CardTitle>
                    {isTyping && (
                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                        Typing...
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
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm dark:bg-gray-800 dark:border-gray-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent dark:via-blue-900/20 animate-pulse"></div>
                            <div className="relative flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              </div>
                              <span className="text-gray-500 text-xs font-medium">
                                AI is thinking...
                              </span>
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
                        className="w-full min-h-[44px] max-h-[120px] resize-none pr-12 py-3 px-4 border border-gray-300 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto transition-all duration-200"
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
                          onClick={handleSendMessage}
                          disabled={
                            (!inputValue.trim() &&
                              attachedFiles.length === 0) ||
                            isLoading
                          }
                          size="icon"
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 rounded-xl h-11 w-11 shadow-lg hover:shadow-xl transition-all duration-200 disabled:shadow-none"
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
