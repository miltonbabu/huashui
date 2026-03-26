"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Link2,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  getUrl: (url: string, title?: string) => string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    name: "Twitter",
    icon: <Twitter className="w-5 h-5" />,
    color: "bg-[#1DA1F2]",
    hoverColor: "hover:bg-[#1a8cd8]",
    getUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || "Check this out!")}`,
  },
  {
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "bg-[#4267B2]",
    hoverColor: "hover:bg-[#365899]",
    getUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    color: "bg-[#0077B5]",
    hoverColor: "hover:bg-[#006097]",
    getUrl: (url, title) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || "Check this out!")}`,
  },
  {
    name: "WhatsApp",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "bg-[#25D366]",
    hoverColor: "hover:bg-[#20bd5a]",
    getUrl: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent((title ? `${title}\n` : "") + url)}`,
  },
  {
    name: "Telegram",
    icon: <Send className="w-5 h-5" />,
    color: "bg-[#0088cc]",
    hoverColor: "hover:bg-[#0077b3]",
    getUrl: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || "")}`,
  },
];

export function SharePopup({ isOpen, onClose, url, title }: SharePopupProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: SocialPlatform) => {
    const shareUrl = platform.getUrl(url, title);
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-lg">Share</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {socialPlatforms.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                        platform.color,
                        platform.hoverColor,
                        "text-white"
                      )}
                      title={`Share on ${platform.name}`}
                    >
                      {platform.icon}
                      <span className="text-[10px] font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                    <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="flex-1 bg-transparent text-sm outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        copied
                          ? "bg-green-500/20 text-green-500"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
