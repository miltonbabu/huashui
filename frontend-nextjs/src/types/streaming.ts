export type StreamEventType = 'token' | 'message' | 'error' | 'done';

export interface StreamEvent {
  type: StreamEventType;
  data?: string | StreamMessageData | StreamErrorData;
}

export interface StreamMessageData {
  id: string;
  content: string;
  reasoning?: string;
  role: 'assistant';
  createdAt: string;
}

export interface StreamErrorData {
  message: string;
  code?: string;
}

export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  currentReasoning?: string;
  error: string | null;
}
