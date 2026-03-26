"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import {
  Atom,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  Share2,
  Pencil,
  X,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { MermaidDiagram } from "./MermaidDiagram";
import { SharePopup } from "./SharePopup";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface MessageBubbleProps {
  message: Message;
  userName?: string;
  onRegenerate?: (message: Message) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    const codeText = String(children).replace(/\n$/, "");
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!className) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  if (language === "mermaid") {
    return <MermaidDiagram code={String(children)} />;
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/70 rounded-t-lg border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none bg-muted rounded-b-lg p-4 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({
  message,
  userName,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasReasoning = message.reasoning && message.reasoning.length > 0;
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shareUrl = `${window.location.origin}/chat/${message.conversationId}`;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editContent.length,
        editContent.length,
      );
    }
  }, [isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = () => {
    setShowSharePopup(true);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (
      onEdit &&
      editContent.trim() &&
      editContent.trim() !== message.content
    ) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col"
    >
      <div
        className={cn(
          "flex items-start gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {isUser ? (
            <span className="text-xs font-medium">
              {userName?.charAt(0).toUpperCase() || "U"}
            </span>
          ) : (
            <Atom className="w-3.5 h-3.5" />
          )}
        </div>

        <div className={cn("flex-1", isUser ? "text-right" : "text-left")}>
          {!isUser && hasReasoning && (
            <div className="mb-2">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground"
              >
                <Atom className="w-3.5 h-3.5" />
                <span>{showReasoning ? "Hide Thinking" : "Show Thinking"}</span>
                {showReasoning ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {showReasoning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>💭</span>
                    <span>Thinking Process</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {message.reasoning}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <div
            className={cn(
              "inline-block px-4 py-3 rounded-2xl min-h-[40px] max-w-full",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-transparent text-foreground rounded-tl-sm border border-border/50",
              isEditing &&
                "bg-card/80 border border-primary/30 w-auto max-w-[500px] min-w-[280px] shadow-lg",
            )}
          >
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[40px] max-h-[120px] bg-transparent border-none outline-none resize-none text-sm text-foreground/90 whitespace-pre-wrap placeholder:text-muted-foreground/50"
                  placeholder="Edit..."
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      !editContent.trim() ||
                      editContent.trim() === message.content
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                </div>
              </div>
            ) : isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="ai-message-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={{
                    code: CodeBlock,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1.5",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            {isUser && !isEditing ? (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title={copied ? "Copied!" : "Copy message"}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleEditClick}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Edit message"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              !isEditing && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title={copied ? "Copied!" : "Copy message"}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Share conversation"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        url={shareUrl}
        title="Check out this conversation on HuaShui AI"
      />
    </motion.div>
  );
}
