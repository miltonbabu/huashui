import { create } from "zustand";
import type { Conversation, Message, ModelType } from "@/types";

interface ChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  selectedModel: ModelType;
  isLoading: boolean;
  isStreaming: boolean;
  streamingReasoning: string;
  streamingContent: string;
  error: string | null;
  sidebarOpen: boolean;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;

  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  setSelectedModel: (model: ModelType) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingReasoning: (reasoning: string) => void;
  appendStreamingReasoning: (chunk: string) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreaming: () => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  selectedModel: "huashui-1",
  isLoading: false,
  isStreaming: false,
  streamingReasoning: "",
  streamingContent: "",
  error: null,
  sidebarOpen: true,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation:
        state.currentConversation?.id === id ? null : state.currentConversation,
      messages: state.currentConversation?.id === id ? [] : state.messages,
    })),

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation, messages: [], error: null }),

  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function" ? messages(state.messages) : messages,
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  setSelectedModel: (model) => set({ selectedModel: model }),

  setLoading: (loading) => set({ isLoading: loading }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setStreamingReasoning: (reasoning) => set({ streamingReasoning: reasoning }),

  appendStreamingReasoning: (chunk) =>
    set((state) => ({
      streamingReasoning: state.streamingReasoning + chunk,
    })),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  clearStreaming: () =>
    set({ streamingReasoning: "", streamingContent: "", isStreaming: false }),

  setError: (error) => set({ error }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
