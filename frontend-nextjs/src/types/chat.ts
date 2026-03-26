export type MessageRole = 'user' | 'assistant' | 'system';

export type ModelType = 'huashui-1' | 'huashui-reasoning';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  reasoning?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: ModelType;
  lastMessagePreview?: string;
  messageCount: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  model?: ModelType;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}
