"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import {
  Layers,
  MessageSquare,
  Sparkles,
  Code,
  Lightbulb,
  Atom,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Languages,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAuthStore, useChatStore } from "@/stores";
import { useSocket } from "@/hooks/useSocket";
import { conversationsApi, messagesApi } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import type { Conversation, Message, ModelType } from "@/types";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

export default function ChatPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    currentConversation,
    messages,
    selectedModel,
    isLoading,
    streamingReasoning,
    streamingContent,
    sidebarOpen,
    toggleSidebar,
    setConversations,
    addConversation,
    setCurrentConversation,
    setMessages,
    addMessage,
    setSelectedModel,
    setLoading,
    setError,
    clearStreaming,
  } = useChatStore();

  // Initialize WebSocket connection for real-time updates
  useSocket();

  // Debug: Log streaming state changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Streaming state updated:", {
        reasoningLength: streamingReasoning?.length || 0,
        contentLength: streamingContent?.length || 0,
        isLoading,
        selectedModel,
      });
    }
  }, [streamingReasoning, streamingContent, isLoading, selectedModel]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    loadConversations();

    // Reload conversations when window gains focus (e.g., after admin deletion)
    const handleFocus = () => {
      loadConversations();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationsApi.getAll({ archived: false });
      if (response.success && response.conversations) {
        const fetchedConversations = response.conversations as Conversation[];
        setConversations(fetchedConversations);

        // Check if current conversation still exists
        if (currentConversation) {
          const stillExists = fetchedConversations.some(
            (c) => c.id === currentConversation.id,
          );
          if (!stillExists) {
            // Conversation was deleted, clear it
            setCurrentConversation(null);
            setMessages([]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagesApi.getByConversation(conversationId);
      if (response.success && response.messages) {
        setMessages(response.messages as Message[]);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError("Failed to load messages");
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSelectedModel(conversation.model);
    loadMessages(conversation.id);
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
  };

  const handleSendMessage = async (content: string) => {
    let conversationId = currentConversation?.id;

    if (!conversationId) {
      try {
        const response = await conversationsApi.create({
          title: content.slice(0, 50) || "New Conversation",
          model: selectedModel,
        });
        console.log("Create conversation response:", response);
        if (response.success && response.conversation) {
          const newConv = response.conversation as Conversation;
          console.log("New conversation ID:", newConv.id);
          addConversation(newConv);
          setCurrentConversation(newConv);
          conversationId = newConv.id;
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
        setError("Failed to create conversation");
        return;
      }
    }

    if (!conversationId) {
      console.error("No conversation ID available");
      setError("Failed to create conversation");
      return;
    }

    await sendMessageToAPI(conversationId, content);
  };

  const sendMessageToAPI = async (conversationId: string, content: string) => {
    setLoading(true);
    setError(null);
    clearStreaming();

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId!,
      role: "user",
      content,
      createdAt: new Date(),
    };
    addMessage(tempUserMessage);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: conversationId!,
            content,
            model: selectedModel,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      if (data.success) {
        // For reasoning model, don't add assistant message from HTTP response
        // It will be added via WebSocket to avoid duplicates
        if (selectedModel === "huashui-reasoning") {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMessage.id),
            data.userMessage as Message,
          ]);
        } else {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMessage.id),
            data.userMessage as Message,
            data.assistantMessage as Message,
          ]);
        }
        loadConversations();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted by user
        console.log("Request aborted by user");
        // Keep the user message but remove loading state
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      } else {
        console.error("Failed to send message:", error);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
      clearStreaming();
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    clearStreaming();
  };

  const handleRegenerate = async (message: Message) => {
    // Find the previous user message
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    if (messageIndex === -1) return;

    // Find the user message that triggered this AI response
    let userMessageIndex = messageIndex - 1;
    while (
      userMessageIndex >= 0 &&
      messages[userMessageIndex].role !== "user"
    ) {
      userMessageIndex--;
    }

    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex];

    // Remove the AI message we're regenerating
    setMessages((prev) => prev.filter((m) => m.id !== message.id));

    // Regenerate without creating a new user message
    if (currentConversation?.id) {
      await regenerateResponse(currentConversation.id, userMessage.content);
    }
  };

  const regenerateResponse = async (
    conversationId: string,
    content: string,
  ) => {
    setLoading(true);
    setError(null);
    clearStreaming();

    try {
      const response = await messagesApi.send({
        conversationId: conversationId!,
        content,
        model: selectedModel,
      });

      if (response.success) {
        // Only add the assistant message, not the user message (it already exists)
        setMessages((prev) => [...prev, response.assistantMessage as Message]);
        loadConversations();
      }
    } catch (error) {
      console.error("Failed to regenerate:", error);
      setError("Failed to regenerate response. Please try again.");
    } finally {
      setLoading(false);
      clearStreaming();
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      // Update the message in the database
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newContent }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update message");
      }

      // Update the message in the local state
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg,
      );
      setMessages(updatedMessages);

      // Regenerate AI response if this is a user message
      const editedMessage = messages.find((msg) => msg.id === messageId);
      if (editedMessage && currentConversation) {
        // Delete all messages after the edited one
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        const messagesToKeep = messages.slice(0, messageIndex + 1);

        // Update the message content
        messagesToKeep[messageIndex] = {
          ...editedMessage,
          content: newContent,
        };

        setMessages(messagesToKeep);

        // Send the edited message to get a new AI response
        await sendMessageToAPI(currentConversation.id, newContent);
      }
    } catch (error) {
      console.error("Failed to edit message:", error);
      setError("Failed to edit message");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        messagesCount={messages.length}
      />

      {/* Sidebar Toggle Button - Always Visible */}
      {!sidebarOpen && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-accent transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {!currentConversation ? (
          <WelcomeScreen
            onQuickAction={setInputMessage}
            onSend={handleSendMessage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isLoading={isLoading}
            inputMessage={inputMessage}
          />
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <EmptyChatState />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-8 lg:px-16 pt-8">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.id}-${index}`}
                    className={cn(
                      "flex w-full mb-4 px-8 sm:px-16 lg:px-24",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] sm:max-w-[65%] lg:max-w-[55%]",
                      )}
                    >
                      <MessageBubble
                        message={msg}
                        userName={user?.name}
                        onRegenerate={handleRegenerate}
                        onEdit={handleEdit}
                      />
                    </div>
                  </div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex w-full mb-4 justify-start px-8 sm:px-16 lg:px-24">
                  <div className="max-w-[75%] sm:max-w-[65%] lg:max-w-[55%]">
                    <StreamingMessage
                      reasoning={streamingReasoning}
                      content={streamingContent}
                      selectedModel={selectedModel}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {currentConversation && (
          <ChatInput
            onSend={handleSendMessage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isLoading={isLoading}
            initialMessage={inputMessage}
            onStop={handleStop}
          />
        )}
      </main>
    </div>
  );
}

function WelcomeScreen({
  onQuickAction,
  onSend,
  selectedModel,
  onModelChange,
  isLoading,
  inputMessage,
}: {
  onQuickAction: (msg: string) => void;
  onSend: (content: string) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  isLoading: boolean;
  inputMessage: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl"
        >
          <Layers className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-3">Welcome to HuaShui AI</h1>
        <p className="text-muted-foreground mb-8">
          Start a conversation by typing a message below
        </p>

        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
          <QuickActionCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="NCWU Info"
            description="University information"
            onClick={() => onQuickAction("Tell me about NCWU")}
          />
          <QuickActionCard
            icon={<Languages className="w-5 h-5" />}
            title="Learn Chinese"
            description="Practice Mandarin"
            onClick={() => onQuickAction("Help me learn Chinese")}
          />
          <QuickActionCard
            icon={<BookOpen className="w-5 h-5" />}
            title="HSK Practice"
            description="Test preparation"
            onClick={() => onQuickAction("Help me practice HSK")}
          />
          <QuickActionCard
            icon={<GraduationCap className="w-5 h-5" />}
            title="Student Support"
            description="Visa, life, campus"
            onClick={() =>
              onQuickAction(
                "I'm an international student, what help can you offer?",
              )
            }
          />
        </div>
      </motion.div>

      <div className="w-full max-w-3xl mt-8">
        <ChatInput
          onSend={onSend}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          isLoading={isLoading}
          initialMessage={inputMessage}
        />
      </div>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left group sm:flex-col sm:items-start sm:text-left"
    >
      <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-xs">{title}</h3>
        <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
          {description}
        </p>
      </div>
    </motion.button>
  );
}

function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-xl font-semibold mb-2">Start your conversation</h3>
        <p className="text-muted-foreground">
          Type a message below to begin chatting with HuaShui AI
        </p>
      </motion.div>
    </div>
  );
}

function StreamingMessage({
  reasoning,
  content,
  selectedModel,
}: {
  reasoning: string;
  content: string;
  selectedModel: string;
}) {
  const isReasoningModel = selectedModel === "huashui-reasoning";
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 p-4"
    >
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
        <Atom className="w-4 h-4" />
      </div>
      <div className="flex-1 max-w-[80%] text-left">
        {/* Show real-time reasoning for reasoning model */}
        {isReasoningModel && reasoning && (
          <div className="mb-3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground"
            >
              <Atom className="w-3.5 h-3.5 animate-pulse" />
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
                  {reasoning}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Show streaming content if available */}
        {content ? (
          <div className="inline-block px-4 py-3 rounded-2xl min-h-[40px] max-w-full bg-transparent text-foreground rounded-tl-sm border border-border/50">
            <div className="ai-message-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                  code: CodeBlock,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Show typing indicator if no content yet */
          <div className="flex items-center gap-1 px-4 py-3 bg-secondary rounded-2xl rounded-tl-sm">
            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!className) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }
  return (
    <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-3">
      <code className={className}>{children}</code>
    </pre>
  );
}
