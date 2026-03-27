"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore, useChatStore } from "@/stores";

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_SOCKET_URL) {
    return (window as any).__ENV__.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && (window as any).__ENV__?.NEXT_PUBLIC_API_URL) {
    return (window as any).__ENV__.NEXT_PUBLIC_API_URL.replace("/api", "");
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";
};

const SOCKET_URL = getSocketUrl();

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const {
    addMessage,
    setStreaming,
    setStreamingReasoning,
    setStreamingContent,
    currentConversation,
  } = useChatStore();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✓ WebSocket connected", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("✗ WebSocket disconnected");
    });

    socketRef.current.on(
      "new-message",
      (data: { type: string; message: any }) => {
        // Only add message via WebSocket for streaming (reasoning model)
        // Standard model messages are already added from API response
        if (
          data.type === "assistant" &&
          data.message?.model === "huashui-reasoning"
        ) {
          addMessage(data.message);
          setStreaming(false);
        }
      },
    );

    socketRef.current.on("ai-typing", () => {
      setStreaming(true);
    });

    socketRef.current.on(
      "ai-thinking",
      (data: { reasoning: string; fullReasoning: string; status: string }) => {
        console.log(
          "🧠 AI Thinking:",
          data.fullReasoning?.substring(0, 50) + "...",
        );
        if (data.status === "thinking") {
          setStreamingReasoning(data.fullReasoning);
        }
      },
    );

    socketRef.current.on(
      "ai-streaming",
      (data: { content: string; fullContent: string; status: string }) => {
        console.log(
          "💬 AI Streaming:",
          data.fullContent?.substring(0, 50) + "...",
        );
        if (data.status === "streaming") {
          setStreamingContent(data.fullContent);
        }
      },
    );

    socketRef.current.on("ai-error", (data: { error: string }) => {
      console.error("AI Error:", data.error);
      setStreaming(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [
    token,
    addMessage,
    setStreaming,
    setStreamingReasoning,
    setStreamingContent,
  ]);

  useEffect(() => {
    if (currentConversation && socketRef.current) {
      socketRef.current.emit("join-conversation", currentConversation.id);

      return () => {
        socketRef.current?.emit("leave-conversation", currentConversation.id);
      };
    }
  }, [currentConversation]);

  const emitTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing", conversationId);
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("stop-typing", conversationId);
  }, []);

  return {
    socket: socketRef.current,
    emitTyping,
    emitStopTyping,
  };
}
