"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Sun,
  Moon,
  Monitor,
  Layers,
  ChevronDown,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { conversationsApi } from "@/lib/api-client";
import { useAuthStore, useChatStore, useThemeStore } from "@/stores";
import type { Conversation } from "@/types";
import { SharePopup } from "./SharePopup";

interface SidebarProps {
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  messagesCount?: number;
}

export function Sidebar({
  onSelectConversation,
  onNewChat,
  messagesCount = 0,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    conversations,
    currentConversation,
    sidebarOpen,
    toggleSidebar,
    removeConversation,
  } = useChatStore();
  const { theme, setTheme } = useThemeStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  const isNewChatDisabled = messagesCount === 0;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await conversationsApi.delete(id);
        removeConversation(id);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleShare = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setShareUrl(`${window.location.origin}/chat/${conv.id}`);
    setShareTitle(`Check out: ${conv.title}`);
    setSharePopupOpen(true);
  };

  const themeIcon = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
  }[theme];

  const ThemeIcon = themeIcon || Monitor;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col overflow-hidden relative fixed md:relative z-50"
    >
      <div className={cn("flex flex-col h-full", !sidebarOpen && "opacity-0")}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">HuaShui AI</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={onNewChat}
            disabled={isNewChatDisabled}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-opacity shadow-lg",
              isNewChatDisabled
                ? "bg-primary/50 text-primary-foreground/50 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  currentConversation?.id === conv.id
                    ? "bg-accent shadow-md"
                    : "hover:bg-accent/50",
                )}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{conv.title}</h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessagePreview || "No messages yet"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full",
                        conv.model === "huashui-reasoning"
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {conv.model === "huashui-reasoning"
                        ? "Reasoning"
                        : "Standard"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {conv.messageCount} msgs
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleShare(e, conv)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
                  title="Share conversation"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <ChevronRight
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                profileOpen && "rotate-90",
              )}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-3 right-3 mb-2 p-2 bg-card border border-border rounded-xl shadow-xl"
              >
                <button
                  onClick={() => {
                    setTheme(
                      theme === "light"
                        ? "dark"
                        : theme === "dark"
                          ? "auto"
                          : "light",
                    );
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <ThemeIcon className="w-4 h-4" />
                  {theme === "light"
                    ? "Dark Mode"
                    : theme === "dark"
                      ? "Auto"
                      : "Light Mode"}
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-primary transition-colors text-sm"
                  >
                    <Layers className="w-4 h-4" />
                    Admin Panel
                  </button>
                )}
                <div className="h-px bg-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SharePopup
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        url={shareUrl}
        title={shareTitle}
      />
    </motion.aside>
  );
}
