import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MessageSquare, Flame, Trash2, Heart, Search, Filter, Award, RefreshCw, Edit, Camera, Siren, Plus, Smile, Pin, X } from "lucide-react";
import { BeerLog, UserProfile, isSeymoreBeers, Pub } from "../types";
import UserAvatar from "./UserAvatar";
import MentionDropdown from "./MentionDropdown";

interface ActivityFeedProps {
  logs: BeerLog[];
  users: UserProfile[];
  currentUser: string;
  pubs: Pub[];
  selectedPubId: string;
  onPubSelect: (pubId: string) => void;
  selectedUserFilter?: string;
  onUserFilterChange?: (user: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  pinnedPubId?: string;
  onPinPub?: (pubId: string) => void;
  onCheersToggled: (id: string) => void;
  onReactionToggled?: (id: string, reactionType: string) => void;
  onLogDeleted: (id: string) => void;
  onLogUpdated: (updatedLog: BeerLog) => void;
  onEditLogRequested?: (log: BeerLog) => void;
  onQuickLogRequested?: () => void;
  onViewProfileRequested?: (username: string) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

interface CommentInputProps {
  logId: string;
  users: UserProfile[];
  currentUser: string;
  onLogUpdated: (updatedLog: BeerLog) => void;
  onViewProfileRequested?: (username: string) => void;
}

function CommentInput({
  logId,
  users,
  currentUser,
  onLogUpdated,
  onViewProfileRequested
}: CommentInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/beers/${encodeURIComponent(logId)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: currentUser, text: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Could not post comment");
      }

      const updatedLog: BeerLog = await response.json();
      onLogUpdated(updatedLog);
      setText("");
    } catch (err) {
      console.error("Comment submission error or timeout:", err);
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2.5 items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
      <div 
        className="cursor-pointer hover:opacity-85 transition-all shrink-0"
        onClick={() => onViewProfileRequested?.(currentUser)}
      >
        <UserAvatar username={currentUser} users={users} className="w-6 h-6 text-[10px] rounded-lg" />
      </div>
      <div className="flex-1 flex gap-2 relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-850 dark:text-slate-100 placeholder-slate-400 transition-all"
        />
        <MentionDropdown
          text={text}
          onChange={setText}
          inputRef={inputRef}
          users={users}
          currentUser={currentUser}
          className="bottom-full mb-1 left-0"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
        >
          {isSubmitting ? "..." : "Post"}
        </button>
      </div>
    </div>
  );
}

function renderTextWithMentions(
  text: string | undefined,
  users: UserProfile[],
  onViewProfileRequested?: (username: string) => void
) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          const username = part.substring(1);
          const exists = users.some(
            (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
          );
          if (exists) {
            return (
              <span
                key={index}
                onClick={() => onViewProfileRequested?.(username)}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer underline decoration-amber-500/50 underline-offset-2"
              >
                {part}
              </span>
            );
          }
        }
        return part;
      })}
    </>
  );
}

const REACTION_TYPES = [
  { key: "cheers", emoji: "🍻", label: "Cheers" },
  { key: "creamy", emoji: "🍺", label: "Creamy" },
  { key: "fomo", emoji: "🚨", label: "FOMO Alert" },
  { key: "nightnight", emoji: "🌙", label: "Night night" },
  { key: "dislike", emoji: "👎", label: "Imposter Pint" }
];

const CUSTOM_EMOJIS = [
  { emoji: "🍺", label: "Creamy" },
  { emoji: "🍻", label: "Cheers" },
  { emoji: "🌙", label: "Night night" },
  { emoji: "🥂", label: "Posh" },
  { emoji: "🍷", label: "Snooty" },
  { emoji: "🥃", label: "Stiff" },
  { emoji: "🍹", label: "Fruity" },
  { emoji: "🔥", label: "Banger" },
  { emoji: "❤️", label: "Mates" },
  { emoji: "👍", label: "Solid" },
  { emoji: "👎", label: "Imposter" },
  { emoji: "😂", label: "Banter" },
  { emoji: "🎉", label: "Session" },
  { emoji: "🚀", label: "Sent" },
  { emoji: "👀", label: "FOMO" },
  { emoji: "💯", label: "Elite" },
  { emoji: "👏", label: "Respect" },
  { emoji: "🙌", label: "Preach" },
  { emoji: "🤩", label: "Stellar" },
  { emoji: "🥳", label: "Rowdy" },
  { emoji: "😎", label: "Smooth" },
  { emoji: "🤔", label: "Dodgy" },
  { emoji: "😮", label: "Gasp" },
  { emoji: "😴", label: "PassedOut" },
  { emoji: "🍕", label: "SoberUp" },
  { emoji: "🍔", label: "PubGrub" },
  { emoji: "🍟", label: "Chips" },
  { emoji: "🥨", label: "Twisted" },
  { emoji: "🥓", label: "Crispy" },
  { emoji: "✨", label: "Magic" },
  { emoji: "🌟", label: "Legend" },
  { emoji: "👑", label: "PintKing" },
  { emoji: "🏰", label: "TheLocal" },
  { emoji: "🍀", label: "Lucky" },
  { emoji: "⚓", label: "Sunk" },
  { emoji: "🏆", label: "Cheers" },
  { emoji: "💔", label: "Spilled" }
];

export default function ActivityFeed({
  logs,
  users,
  currentUser,
  pubs,
  selectedPubId,
  onPubSelect,
  selectedUserFilter,
  onUserFilterChange,
  searchTerm: propSearchTerm,
  onSearchTermChange,
  pinnedPubId,
  onPinPub,
  onCheersToggled,
  onReactionToggled,
  onLogDeleted,
  onLogUpdated,
  onEditLogRequested,
  onQuickLogRequested,
  onViewProfileRequested,
  onLoadMore,
  loadingMore,
  hasMore
}: ActivityFeedProps) {
  const [activeReactionTooltip, setActiveReactionTooltip] = useState<string | null>(null);
  const [activeCustomEmojiLogId, setActiveCustomEmojiLogId] = useState<string | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(propSearchTerm || "");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearchTerm(propSearchTerm || "");
  }, [propSearchTerm]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearchTerm(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (onSearchTermChange) {
      searchDebounceRef.current = setTimeout(() => {
        onSearchTermChange(val);
      }, 250);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    onSearchTermChange?.("");
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveReactionTooltip(null);
      setActiveCustomEmojiLogId(null);
    };

    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, []);

  const REACTION_METADATA_MAP: Record<string, { emoji: string; label: string }> = {
    cheers: { emoji: "🍻", label: "Cheers" },
    creamy: { emoji: "🍺", label: "Creamy" },
    fomo: { emoji: "🚨", label: "FOMO Alert" },
    nightnight: { emoji: "🌙", label: "Night night" },
    dislike: { emoji: "👎", label: "Imposter" },
    drunk: { emoji: "🥴", label: "Drunk" },
    juicy: { emoji: "🍑", label: "Juicy" },
  };

  const getReactionDisplay = (key: string): { emoji: string; label: string } => {
    if (REACTION_METADATA_MAP[key]) {
      return REACTION_METADATA_MAP[key];
    }
    const customByEmoji = CUSTOM_EMOJIS.find(e => e.emoji === key);
    if (customByEmoji) {
      return { emoji: customByEmoji.emoji, label: customByEmoji.label };
    }
    const customByLabel = CUSTOM_EMOJIS.find(e => e.label.toLowerCase() === key.toLowerCase());
    if (customByLabel) {
      return { emoji: customByLabel.emoji, label: customByLabel.label };
    }
    const isEmojiChar = /\p{Extended_Pictographic}/u.test(key);
    if (isEmojiChar) {
      return { emoji: key, label: key };
    }
    return { emoji: "🍺", label: key };
  };

  const getReactionList = (log: BeerLog, type: string): string[] => {
    if (type === "cheers") {
      return log.cheers || [];
    }
    return log.reactions?.[type] || [];
  };

  const mapEmojiToReactionKey = (emoji: string): string => {
    const mapping: Record<string, string> = {
      "🍻": "cheers",
      "🍺": "creamy",
      "🚨": "fomo",
      "🌙": "nightnight",
      "🥴": "drunk",
      "🍑": "juicy",
      "👎": "dislike"
    };
    return mapping[emoji] || emoji;
  };

  const handleReact = (logId: string, reactionKey: string) => {
    if (!currentUser) {
      return;
    }
    const key = mapEmojiToReactionKey(reactionKey);
    if (key === "cheers") {
      onCheersToggled(logId);
    } else if (onReactionToggled) {
      onReactionToggled(logId, key);
    }
  };

  const renderReactionSummary = (log: BeerLog) => {
    // Collect standard reactions
    const standardReactions = REACTION_TYPES.map((react) => {
      const list = getReactionList(log, react.key);
      return { react: { key: react.key, emoji: react.emoji, label: react.label }, list };
    });

    // Collect custom ones
    const standardKeys = ["cheers", "creamy", "fomo", "drunk", "juicy", "dislike"];
    const customReactionKeys = log.reactions 
      ? Object.keys(log.reactions).filter(k => !standardKeys.includes(k) && log.reactions[k] && log.reactions[k].length > 0)
      : [];

    const customReactions = customReactionKeys.map((emojiKey) => {
      const list = getReactionList(log, emojiKey);
      return { react: { key: emojiKey, emoji: emojiKey, label: emojiKey }, list };
    });

    const activeReactions = [...standardReactions, ...customReactions].filter(({ list }) => list.length > 0);

    if (activeReactions.length === 0) {
      return <span className="italic text-slate-300 text-[10px] dark:text-slate-600">Be the first to react!</span>;
    }

    return (
      <div className="flex flex-wrap justify-start gap-x-1.5 gap-y-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
        {activeReactions.map(({ react, list }, i) => {
          const tooltipKey = `${log.id}-${react.key}`;
          const isTooltipActive = activeReactionTooltip === tooltipKey;
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActiveReactionTooltip(prev => prev === tooltipKey ? null : tooltipKey);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className={`relative group px-2 py-0.5 rounded-full border cursor-pointer flex items-center gap-1.5 transition-all duration-150 text-[10px] font-extrabold select-none ${
                isTooltipActive
                  ? "bg-amber-500/15 text-amber-600 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800"
              }`}
            >
              <span className="text-[11px]">{react.emoji}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider">{react.label}</span>
              <span className="text-[10px] font-black opacity-80">{list.length}</span>

              {/* Custom interactive tooltip showing who reacted what */}
              <div
                className={`absolute bottom-full mb-2 right-0 transition-all duration-150 z-30 flex flex-col items-end ${
                  isTooltipActive
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 group-hover:opacity-100 pointer-events-none scale-95 group-hover:scale-100"
                }`}
              >
                <div className="bg-slate-900/95 text-white text-[10px] font-extrabold normal-case py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800 flex flex-col gap-0.5 min-w-[120px] text-right">
                  <span className="text-amber-400 font-black tracking-wider text-[8px] uppercase mb-0.5">{react.label} by:</span>
                  {list.map((uname, idx) => {
                    const uProfile = users.find(u => u.username === uname);
                    return (
                      <span key={idx} className="block text-slate-200">
                        {uProfile?.realName ? `${uProfile.realName} (@${uname})` : `@${uname}`}
                      </span>
                    );
                  })}
                </div>
                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-[3px] mr-3 border-r border-b border-slate-800"></div>
              </div>
            </span>
          );
        })}
      </div>
    );
  };

  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [activeCommentPicker, setActiveCommentPicker] = useState<string | null>(null);

  const toggleComments = (logId: string) => {
    setExpandedComments((prev) => {
      const log = logs.find((l) => l.id === logId);
      const defaultExpanded = !!(log?.comments && log.comments.length > 0);
      const currentVal = prev[logId] ?? defaultExpanded;
      return {
        ...prev,
        [logId]: !currentVal
      };
    });
  };

  const handleAddComment = async (logId: string) => {
    const text = newCommentTexts[logId]?.trim();
    if (!text) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/beers/${encodeURIComponent(logId)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: currentUser, text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Could not post comment");
      }

      const updatedLog: BeerLog = await response.json();
      onLogUpdated(updatedLog);
      
      // Clear input text
      setNewCommentTexts((prev) => ({
        ...prev,
        [logId]: "",
      }));
    } catch (err) {
      console.error("Add comment error/timeout:", err);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleDeleteComment = async (logId: string, commentId: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    // Optimistically remove comment locally
    const updatedComments = (targetLog.comments || []).filter((c) => c.id !== commentId);
    const updatedLog = { ...targetLog, comments: updatedComments };
    onLogUpdated(updatedLog);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/beers/${encodeURIComponent(logId)}/comments/${encodeURIComponent(commentId)}?currentUser=${encodeURIComponent(currentUser)}`, {
        method: "DELETE",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Could not delete comment");
      }

      const serverLog: BeerLog = await response.json();
      onLogUpdated(serverLog);
    } catch (err) {
      console.error(err);
      // Revert if failed
      onLogUpdated(targetLog);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleToggleCommentReaction = async (logId: string, commentId: string, reaction: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    const targetComment = (targetLog.comments || []).find((c) => c.id === commentId);
    if (!targetComment) return;

    // Optimistically update comment reaction
    const currentReactions = targetComment.reactions ? { ...targetComment.reactions } : {};
    const currentUsers = currentReactions[reaction] ? [...currentReactions[reaction]] : [];
    const userIdx = currentUsers.indexOf(currentUser);

    if (userIdx !== -1) {
      currentUsers.splice(userIdx, 1);
    } else {
      currentUsers.push(currentUser);
    }

    if (currentUsers.length === 0) {
      delete currentReactions[reaction];
    } else {
      currentReactions[reaction] = currentUsers;
    }

    const updatedComments = (targetLog.comments || []).map((c) => {
      if (c.id === commentId) {
        return { ...c, reactions: currentReactions };
      }
      return c;
    });

    const updatedLog = { ...targetLog, comments: updatedComments };
    onLogUpdated(updatedLog);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `/api/beers/${encodeURIComponent(logId)}/comments/${encodeURIComponent(commentId)}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: currentUser, reaction }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Could not update comment reaction");
      }

      const serverLog: BeerLog = await response.json();
      onLogUpdated(serverLog);
    } catch (err) {
      console.error("Error toggling comment reaction:", err);
      // Revert on error
      onLogUpdated(targetLog);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const getUserAvatar = (username: string) => {
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return user?.avatar || "👤";
  };

  const getUserBio = (username: string) => {
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return user?.bio || "Craft beer enjoyer.";
  };

  // Helper to format date beautifully
  const formatBeerDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(d.getTime())) return "Sometime";

    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Helper to get the exact time string
  const getExactTimeStr = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  // Helper to determine if a date is "after midnight" (12:00 AM to 4:59 AM)
  const isAfterMidnight = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return false;
    const hours = d.getHours();
    return hours >= 0 && hours < 5;
  };

  // Helper to format date with its exact time
  const formatBeerDateWithTime = (isoString: string) => {
    const baseDate = formatBeerDate(isoString);
    const timeStr = getExactTimeStr(isoString);
    if (!timeStr) return baseDate;
    
    if (baseDate === "Just now") return `Just now (${timeStr})`;
    if (baseDate.endsWith("ago")) return `${baseDate} (${timeStr})`;
    
    return `${baseDate} at ${timeStr}`;
  };

  const activeSearchTerm = (propSearchTerm || localSearchTerm).trim();

  // Filtering logs (database-scoped queries handle user/pub/style/search filters)
  const filteredLogs = logs.filter((log) => {

    if (!activeSearchTerm) return true;
    const term = activeSearchTerm.toLowerCase();
    return (
      (log.beerName && log.beerName.toLowerCase().includes(term)) ||
      (log.beerStyle && log.beerStyle.toLowerCase().includes(term)) ||
      (log.comment && log.comment.toLowerCase().includes(term)) ||
      (log.user && log.user.toLowerCase().includes(term))
    );
  });

  const uniqueFilteredLogs: BeerLog[] = [];
  const seenLogIds = new Set<string>();
  filteredLogs.forEach((l) => {
    if (l && l.id && !seenLogIds.has(l.id)) {
      seenLogIds.add(l.id);
      uniqueFilteredLogs.push(l);
    }
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto" id="activity-feed-view">
      <style>{`
        @keyframes drunkSway {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); filter: blur(0px); }
          10% { transform: translate(-0.25px, 0.15px) rotate(-0.04deg); filter: blur(0.1px); }
          20% { transform: translate(0.2px, -0.2px) rotate(0.03deg); filter: blur(0.05px); }
          30% { transform: translate(-0.15px, -0.15px) rotate(-0.05deg); filter: blur(0.25px); }
          40% { transform: translate(0.25px, 0.15px) rotate(0.04deg); filter: blur(0.1px); }
          50% { transform: translate(-0.1px, -0.3px) rotate(-0.02deg); filter: blur(0.35px); }
          60% { transform: translate(0.2px, 0.15px) rotate(0.05deg); filter: blur(0.2px); }
          70% { transform: translate(-0.2px, -0.08px) rotate(-0.04deg); filter: blur(0.08px); }
          80% { transform: translate(0.25px, -0.2px) rotate(0.06deg); filter: blur(0.3px); }
          90% { transform: translate(-0.15px, 0.25px) rotate(-0.03deg); filter: blur(0.1px); }
        }
        @keyframes photoBlurSway {
          0%, 100% { transform: scale(1) translate(0px, 0px) rotate(0deg); filter: blur(0px); }
          20% { transform: scale(1.0015) translate(-0.2px, 0.15px) rotate(-0.02deg); filter: blur(0.2px); }
          40% { transform: scale(0.999) translate(0.18px, -0.18px) rotate(0.02deg); filter: blur(0.4px); }
          60% { transform: scale(1.001) translate(-0.12px, -0.1px) rotate(-0.01deg); filter: blur(0.15px); }
          80% { transform: scale(1.0005) translate(0.2px, -0.12px) rotate(0.03deg); filter: blur(0.35px); }
        }
        @keyframes benderSirenAlert {
          0%, 100% {
            border-color: #ef4444;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.45), inset 0 0 8px rgba(239, 68, 68, 0.15);
          }
          50% {
            border-color: #f97316;
            box-shadow: 0 0 25px rgba(249, 115, 22, 0.65), inset 0 0 12px rgba(249, 115, 22, 0.25);
          }
        }
        @keyframes strobeLight {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes sirenAmbient {
          0%, 100% {
            background-image: radial-gradient(circle at 15% 25%, rgba(239, 68, 68, 0.28) 0%, transparent 65%),
                              radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.15) 0%, transparent 65%);
          }
          50% {
            background-image: radial-gradient(circle at 15% 25%, rgba(245, 158, 11, 0.25) 0%, transparent 65%),
                              radial-gradient(circle at 85% 75%, rgba(239, 68, 68, 0.15) 0%, transparent 65%);
          }
        }
        .animate-drunk-sway {
          animation: drunkSway 3.5s ease-in-out infinite;
        }
        .animate-bender-combined {
          animation: drunkSway 2.8s ease-in-out infinite, benderSirenAlert 1.5s ease-in-out infinite;
        }
        .animate-photo-bender {
          animation: photoBlurSway 3.6s ease-in-out infinite;
        }
        .animate-strobe {
          background-size: 200% auto;
          animation: strobeLight 0.8s linear infinite;
        }
        .animate-siren-ambient {
          animation: sirenAmbient 2.0s ease-in-out infinite;
        }
      `}</style>
      
      {/* Quick Log Pint CTA Banner - Sticky on scroll */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 -mt-6 pt-2 pb-2 bg-slate-50 dark:bg-slate-950 transition-all">
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-xl p-2.5 sm:p-3.5 shadow-md border border-amber-600/10 flex flex-row items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 truncate">
              Time for a Pint? 🍻
            </h3>
            <p className="text-white/90 text-[11px] font-semibold leading-normal hidden sm:block">
              Creamy pint, meet camera. Friends, meet regret.
            </p>
          </div>
          
          <button
            onClick={onQuickLogRequested}
            className="bg-white hover:bg-slate-50 text-amber-600 font-extrabold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer uppercase shrink-0 tracking-wider font-sans whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" /> Log a Pint
          </button>
        </div>
      </div>

      {/* Compact Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search beers, styles, notes..."
              value={localSearchTerm}
              onChange={handleSearchInputChange}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all truncate"
            />
            {localSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {/* Pub Filter (Global or Specific Pub) */}
          <div className="relative shrink-0 w-36 sm:w-48 flex items-center gap-1">
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedPubId === "all" || !selectedPubId ? "global" : selectedPubId}
                onChange={(e) => onPubSelect(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all cursor-pointer appearance-none shadow-sm truncate"
              >
                <option value="global">🌍 Global Feed</option>
                {pubs.filter(p => p.members.includes(currentUser)).map((p) => {
                  const isImg = p.emblem && (p.emblem.startsWith("http://") || p.emblem.startsWith("https://") || p.emblem.startsWith("/") || p.emblem.startsWith("data:image"));
                  const displayEmblem = p.emblem ? (isImg ? "🖼️" : p.emblem) : "🏠";
                  return (
                    <option key={p.id} value={p.id}>
                      {displayEmblem} {p.name}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 dark:text-slate-500">
                <Filter className="w-3 h-3" />
              </div>
            </div>
            {onPinPub && pinnedPubId !== (selectedPubId || "global") && (
              <button
                type="button"
                id="pin-pub-feed-button"
                onClick={() => onPinPub(selectedPubId || "global")}
                title="Pin as default view to start"
                className="p-1.5 rounded-lg border transition-all shrink-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {activeSearchTerm && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg text-xs text-amber-900 dark:text-amber-200">
            <span className="font-semibold flex items-center gap-1.5 text-[11px] truncate">
              <span>🔍</span> Results for: <span className="font-bold underline">{activeSearchTerm}</span>
            </span>
            <button
              onClick={handleClearSearch}
              className="text-amber-700 dark:text-amber-300 hover:underline text-[10px] font-bold cursor-pointer shrink-0 ml-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {uniqueFilteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center bg-white border border-dashed border-slate-200 rounded-xl py-12 px-6"
            >
              <div className="text-4xl mb-3">🍻</div>
              <h3 className="text-lg font-bold text-slate-700">No pints found</h3>
              <p className="text-xs text-slate-400 mt-1">Be the first to log a pint, or try adjusting your search filters!</p>
            </motion.div>
          ) : (
            uniqueFilteredLogs.map((log) => {
              const hasCheered = log.cheers.includes(currentUser);
              const isDenied = getReactionList(log, "dislike").length >= 3;
              
              // Calculate if this user is on a bender (4+ pints logged on the same calendar day)
              // and ensure ONLY the 4th beer and subsequent beers of that day show the bender alert
              const checkInDateStr = log.date.split("T")[0];
              const logsTodayForUser = logs.filter(
                (l) => l.user === log.user && l.date.split("T")[0] === checkInDateStr
              );
              const sortedLogsToday = [...logsTodayForUser].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              const logIndex = sortedLogsToday.findIndex((l) => l.id === log.id);
              const isOnBender = logsTodayForUser.length >= 4 && logIndex >= 3;

              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden transition-all shadow-sm relative ${
                    isDenied
                      ? "border-red-600 dark:border-red-800 shadow-[inset_0_0_20px_rgba(220,38,38,0.08)] bg-red-50/5"
                      : isOnBender
                        ? "border-amber-400/80 dark:border-amber-500/50 shadow-sm ring-1 ring-amber-500/20 animate-drunk-sway"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {isDenied && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 select-none bg-red-500/[0.03] backdrop-blur-[0.5px]">
                      <div className="border-8 border-double border-red-600 text-red-600 font-sans font-black text-4xl sm:text-5xl md:text-6xl px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 shadow-2xl tracking-widest -rotate-12 transform scale-100 flex flex-col items-center gap-1 animate-pulse select-none">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-red-500 font-black">👮‍♂️ INQUISITION POLICE 👮‍♂️</span>
                        <span className="font-extrabold text-red-700 text-5xl sm:text-6xl md:text-7xl tracking-widest drop-shadow-sm select-none">DENIED</span>
                        <span className="text-[9px] sm:text-[11px] font-black uppercase text-red-500 tracking-[0.15em]">NOT A REAL PINT! 🕵️</span>
                      </div>
                    </div>
                  )}

                  {/* Log Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onViewProfileRequested?.(log.user)}
                      >
                        <UserAvatar username={log.user} users={users} className="w-9 h-9 text-lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            className="font-bold text-slate-800 text-sm hover:underline cursor-pointer"
                            onClick={() => onViewProfileRequested?.(log.user)}
                          >
                            {log.user}
                          </span>
                          {log.rating === 5 && (
                            <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" title="Elite rating!" />
                          )}
                          {isOnBender && !isDenied && (
                            <span 
                              className="bg-amber-500/10 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider inline-flex items-center gap-1 border border-amber-300 dark:border-amber-700/60 shadow-xs"
                              title={`${log.user} is on a bender (4+ pints logged today)!`}
                            >
                              🚨 Bender Alert
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {formatBeerDateWithTime(log.date)}
                          </p>
                          {isAfterMidnight(log.date) && (
                            <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest border border-violet-500/20 animate-pulse">
                              🌙 Gremlin Hour
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {log.user === currentUser && (
                        <button
                          onClick={() => onEditLogRequested?.(log)}
                          className="text-slate-300 hover:text-amber-500 p-2 rounded-lg hover:bg-amber-50/50 transition-all focus:outline-none cursor-pointer"
                          title="Edit pint details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {(isSeymoreBeers(currentUser) || log.user.toLowerCase() === currentUser.toLowerCase()) && (
                        <button
                          onClick={() => setLogToDelete(log.id)}
                          className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50/50 transition-all focus:outline-none cursor-pointer"
                          title={log.user.toLowerCase() === currentUser.toLowerCase() ? "Delete your post" : "Delete log (Admin)"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Log Body */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {log.beerName && 
                         log.beerName.trim().toLowerCase() !== "unnamed pint" && 
                         log.beerName.trim().toLowerCase() !== "unnamed pint 🍺" ? (
                          <>
                            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base md:text-lg leading-tight">
                              {log.beerName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {log.abv > 0 && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                  {log.abv.toFixed(1)}% ABV
                                </span>
                              )}
                              {log.hadCig && (
                                <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase animate-pulse flex items-center gap-1" title="Yes, they smoked a dart with this pint. Absolute beast mode.">
                                  🚬 Dart Combo Activated
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {log.abv > 0 && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                {log.abv.toFixed(1)}% ABV
                              </span>
                            )}
                            {log.hadCig && (
                              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase animate-pulse flex items-center gap-1" title="Yes, they smoked a dart with this pint. Absolute beast mode.">
                                  🚬 Dart Combo Activated
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Display Stars */}
                      {log.rating > 0 ? (
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= log.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Logged Photo */}
                    {log.imageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200/85 bg-slate-50 max-h-80 w-full flex items-center justify-center shadow-sm">
                        <img
                          src={log.imageUrl}
                          alt={`${log.beerName} by ${log.user}`}
                          className={`object-cover max-h-80 w-full hover:scale-[1.01] transition-all duration-300 ${
                            isOnBender ? "animate-photo-bender" : ""
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Reaction Bar & Preset Buttons */}
                    {(() => {
                      // Reactions nobody has used yet stay muted/ghosted so the bar doesn't
                      // shout five colors at once - color is reserved for genuine engagement.
                      const ghostClass = "bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60";
                      const presets = [
                        { 
                          key: "cheers", 
                          emoji: "🍻", 
                          label: "Cheers", 
                          activeClass: "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs",
                          unselectedClass: "bg-amber-50/90 text-amber-850 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        },
                        { 
                          key: "creamy", 
                          emoji: "🍺", 
                          label: "Creamy", 
                          activeClass: "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/20 shadow-xs",
                          unselectedClass: "bg-amber-50/90 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        },
                        { 
                          key: "fomo", 
                          emoji: "🚨", 
                          label: "FOMO Alert", 
                          activeClass: "bg-orange-600 text-white border-orange-600 ring-2 ring-orange-500/20 shadow-xs",
                          unselectedClass: "bg-orange-50/90 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/80 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                        },
                        { 
                          key: "nightnight", 
                          emoji: "🌙", 
                          label: "Night night", 
                          activeClass: "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs",
                          unselectedClass: "bg-indigo-50/90 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        },
                        { 
                          key: "dislike", 
                          emoji: "👎", 
                          label: "Imposter", 
                          activeClass: "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/20 shadow-xs",
                          unselectedClass: "bg-rose-50/90 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                        },
                      ];

                      const presetKeys = presets.map(p => p.key);
                      const customReactionKeys = log.reactions 
                        ? Object.keys(log.reactions).filter(k => !presetKeys.includes(k) && log.reactions[k] && log.reactions[k].length > 0)
                        : [];

                      const customReactions = customReactionKeys.map((emojiKey) => {
                        const list = getReactionList(log, emojiKey);
                        const display = getReactionDisplay(emojiKey);
                        return { key: emojiKey, emoji: display.emoji, label: display.label, list };
                      });

                      return (
                        <div className="flex items-center justify-start gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          {/* Pre-labeled buttons & Custom emoji reactions & Plus selector */}
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            {/* Preset Buttons */}
                            {presets.map((react) => {
                              const reactorList = getReactionList(log, react.key);
                              const hasReacted = reactorList.includes(currentUser);
                              const count = reactorList.length;

                              return (
                                <div key={react.key} className="relative group">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleReact(log.id, react.key);
                                    }}
                                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-extrabold border transition-all duration-150 active:scale-95 hover:scale-105 cursor-pointer select-none ${
                                      hasReacted
                                        ? `${react.activeClass} font-black`
                                        : count > 0
                                        ? react.unselectedClass
                                        : ghostClass
                                    }`}
                                  >
                                    <span className="text-[12px]">{react.emoji}</span>
                                    <span className="text-[10px] font-bold">{react.label}</span>
                                    {count > 0 && (
                                      <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                        hasReacted ? "bg-black/25 text-white" : "bg-black/10 dark:bg-white/10 text-current"
                                      }`}>
                                        {count}
                                      </span>
                                    )}
                                  </button>

                                  {/* Hover Tooltip showing who reacted */}
                                  {count > 0 && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-30 scale-95 group-hover:scale-100 flex flex-col items-center">
                                      <div className="bg-slate-900/95 text-white text-[10px] font-extrabold normal-case py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800 flex flex-col gap-0.5 min-w-[120px] text-center">
                                        <span className="text-amber-400 font-black tracking-wider text-[8px] uppercase mb-0.5">{react.label}:</span>
                                        {reactorList.map((uname, idx) => {
                                          const uProfile = users.find(u => u.username === uname);
                                          return (
                                            <span key={idx} className="block text-slate-200">
                                              {uProfile?.realName ? `${uProfile.realName} (@${uname})` : `@${uname}`}
                                            </span>
                                          );
                                        })}
                                      </div>
                                      <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-[3px] border-r border-b border-slate-800"></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Additional Custom Active Reactions */}
                            {customReactions.map(({ key, emoji, label, list }) => {
                              const hasReacted = list.includes(currentUser);
                              return (
                                <div key={key} className="relative group">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleReact(log.id, key);
                                    }}
                                    className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-extrabold border transition-all duration-150 active:scale-95 hover:scale-105 cursor-pointer select-none ${
                                      hasReacted
                                        ? "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm font-black"
                                        : "bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    }`}
                                  >
                                    <span className="text-[12px]">{emoji}</span>
                                    <span className="text-[10px] font-bold">{label}</span>
                                    <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                      hasReacted ? "bg-black/25 text-white" : "bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                                    }`}>
                                      {list.length}
                                    </span>
                                  </button>

                                  {/* Hover Tooltip showing who reacted */}
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-30 scale-95 group-hover:scale-100 flex flex-col items-center">
                                    <div className="bg-slate-900/95 text-white text-[10px] font-extrabold normal-case py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-800 flex flex-col gap-0.5 min-w-[120px] text-center">
                                      <span className="text-amber-400 font-black tracking-wider text-[8px] uppercase mb-0.5">{label}:</span>
                                      {list.map((uname, idx) => {
                                        const uProfile = users.find(u => u.username === uname);
                                        return (
                                          <span key={idx} className="block text-slate-200">
                                            {uProfile?.realName ? `${uProfile.realName} (@${uname})` : `@${uname}`}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-[3px] border-r border-b border-slate-800"></div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add Custom Emoji Popup Button */}
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveCustomEmojiLogId(activeCustomEmojiLogId === log.id ? null : log.id);
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                className={`flex items-center justify-center w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full border transition-all cursor-pointer ${
                                  activeCustomEmojiLogId === log.id
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500"
                                }`}
                                title="Add custom emoji reaction"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              {activeCustomEmojiLogId === log.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xl z-40 flex flex-col gap-1.5 w-[212px] origin-bottom transition-all duration-150"
                                >
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-1">React with Emoji</span>
                                  <div className="grid grid-cols-6 gap-0.5">
                                    {CUSTOM_EMOJIS.map((em) => (
                                      <div key={em.emoji} className="relative group/emoji flex items-center justify-center animate-fade-in">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleReact(log.id, em.emoji);
                                            setActiveCustomEmojiLogId(null);
                                          }}
                                          className="w-8 h-8 text-base rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer flex items-center justify-center select-none"
                                          title={em.label}
                                        >
                                          {em.emoji}
                                        </button>
                                        
                                        {/* Floating tooltip on hover */}
                                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/emoji:opacity-100 pointer-events-none transition-all duration-100 z-50 scale-90 group-hover/emoji:scale-100 flex flex-col items-center">
                                          <div className="bg-slate-900/95 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2 rounded shadow-xl border border-slate-800 whitespace-nowrap">
                                            {em.label}
                                          </div>
                                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-[3px] border-r border-b border-slate-800"></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Caption Block */}
                    {log.comment && (
                      <div className="bg-amber-500/10 dark:bg-amber-950/60 rounded-xl p-3 border-l-4 border-amber-500 border border-amber-500/20 dark:border-amber-700/50 shadow-2xs relative mt-3 transition-all">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                            📝 Current Vibe
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-snug">
                          {renderTextWithMentions(log.comment, users, onViewProfileRequested)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Interaction Footer */}
                  <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-2">
                    {/* Left: Comments Button */}
                    <div className="flex items-center shrink-0">
                      {(() => {
                        const hasComments = !!(log.comments && log.comments.length > 0);
                        const isExpanded = expandedComments[log.id] ?? hasComments;
                        return (
                          <button
                            onClick={() => toggleComments(log.id)}
                            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-amber-100/80 border-amber-400 text-amber-900 shadow-xs"
                                : hasComments
                                ? "bg-amber-50/60 hover:bg-amber-50 border-amber-200 text-amber-850"
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <MessageSquare className={`w-3.5 h-3.5 ${isExpanded || hasComments ? "text-amber-500 fill-amber-500" : "text-slate-500"}`} />
                            <span className="hidden sm:inline">Comments</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${isExpanded || hasComments ? "bg-amber-200/80 text-amber-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                              {log.comments?.length || 0}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {(expandedComments[log.id] ?? !!(log.comments && log.comments.length > 0)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="comment-container"
                      >
                        <div className="p-4 space-y-4">
                          {/* List of comments */}
                          {log.comments && log.comments.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                              {log.comments.map((cmt) => (
                                <div key={cmt.id} className="flex gap-2.5 items-start">
                                  <div 
                                    className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                    onClick={() => onViewProfileRequested?.(cmt.user)}
                                  >
                                    <UserAvatar username={cmt.user} users={users} className="w-6 h-6 text-[10px] rounded-lg" />
                                  </div>
                                  <div className="flex-1 comment-bubble min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span 
                                          className="comment-username hover:underline cursor-pointer truncate"
                                          onClick={() => onViewProfileRequested?.(cmt.user)}
                                        >
                                          {cmt.user}
                                        </span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">
                                          {formatBeerDate(cmt.date)}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {/* Thumbs up & Thumbs down in top right */}
                                        {[
                                          { emoji: "👍", label: "Like" },
                                          { emoji: "👎", label: "Dislike" },
                                        ].map(({ emoji, label }) => {
                                          const userList = cmt.reactions?.[emoji] || [];
                                          const hasReacted = userList.includes(currentUser);
                                          return (
                                            <button
                                              key={emoji}
                                              type="button"
                                              onClick={() => handleToggleCommentReaction(log.id, cmt.id, emoji)}
                                              title={
                                                userList.length > 0
                                                  ? `${label}: ${userList.join(", ")}`
                                                  : `React with ${label}`
                                              }
                                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-0.5 border select-none ${
                                                hasReacted
                                                  ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 font-bold shadow-2xs"
                                                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-600 dark:hover:text-slate-300"
                                              }`}
                                            >
                                              <span className="leading-none text-[11px]">{emoji}</span>
                                              {userList.length > 0 && (
                                                <span className="text-[9px] font-extrabold">{userList.length}</span>
                                              )}
                                            </button>
                                          );
                                        })}

                                        {(isSeymoreBeers(currentUser) || cmt.user.toLowerCase() === currentUser.toLowerCase()) && (
                                          <button
                                            onClick={() => handleDeleteComment(log.id, cmt.id)}
                                            className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-all focus:outline-none ml-0.5"
                                            title="Delete comment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="comment-body break-words mt-0.5">
                                      {renderTextWithMentions(cmt.text, users, onViewProfileRequested)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic text-center py-2">No comments yet. Write something friendly below!</p>
                          )}

                          {/* Write comment box */}
                          <CommentInput
                            logId={log.id}
                            users={users}
                            currentUser={currentUser}
                            onLogUpdated={onLogUpdated}
                            onViewProfileRequested={onViewProfileRequested}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {hasMore && onLoadMore && (
          <div className="mt-8 flex justify-center pb-4">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-500 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Fetching older pints...</span>
                </>
              ) : (
                <span>Load More Pints 🍻</span>
              )}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-lg">Are you sure?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  This action cannot be undone. Are you sure you want to delete this pint check-in?
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onLogDeleted(logToDelete);
                    setLogToDelete(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Delete Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
