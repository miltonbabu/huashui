"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Atom, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModelType } from "@/types";

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  isLoading: boolean;
  initialMessage?: string;
  onStop?: () => void;
}

export function ChatInput({
  onSend,
  selectedModel,
  onModelChange,
  isLoading,
  initialMessage = "",
  onStop,
}: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startVoiceInput = () => {
    if (typeof window !== "undefined") {
      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognition =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setMessage(transcript);
            }
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert("Voice recognition is not supported in this browser.");
      }
    } else {
      alert("Voice recognition is not supported in this browser.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedModel === "huashui-reasoning"
                ? "Message HuaShui (Reasoning mode)"
                : "Message HuaShui"
            }
            className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm min-h-[48px] max-h-[200px]"
            rows={1}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onModelChange(
                    selectedModel === "huashui-reasoning"
                      ? "huashui-1"
                      : "huashui-reasoning",
                  )
                }
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  selectedModel === "huashui-reasoning"
                    ? "bg-primary/20 text-primary shadow-md shadow-primary/30 ring-1 ring-primary/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
              >
                <Atom className="w-3.5 h-3.5" />
                DeepThink
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startVoiceInput}
                className={cn(
                  "w-11 h-11 rounded-lg",
                  isListening &&
                    "bg-destructive/20 text-destructive animate-pulse",
                )}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={onStop}
                  className="w-11 h-11 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/30 animate-pulse"
                >
                  <Square className="w-5 h-5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  disabled={!message.trim()}
                  className={cn(
                    "w-11 h-11 rounded-lg border-0 shadow-none transition-colors",
                    message.trim()
                      ? "text-primary hover:text-primary hover:bg-primary/10"
                      : "text-muted-foreground bg-transparent hover:bg-transparent",
                  )}
                >
                  <Send className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
