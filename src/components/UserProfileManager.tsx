import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Calendar, Sparkles, X, Smile, Trash2, Trophy, Flame, Award, Shield, Heart, ZoomIn, ZoomOut, Pencil, ArrowLeft } from "lucide-react";
import { UserProfile, BeerLog, isSeymoreBeers } from "../types";
import { getMostDrankBeerForUser, compressImage } from "../utils";
import UserAvatar from "./UserAvatar";
import FriendsHub from "./FriendsHub";

interface UserProfileManagerProps {
  users: UserProfile[];
  currentUser: string;
  logs: BeerLog[];
  onCurrentUserChanged: (username: string) => void;
  onProfileAddedOrUpdated: (profile: UserProfile) => void;
  onProfileDeleted: (username: string) => void;
  onSelfAccountDeleted: (password: string) => Promise<{ success: boolean; error?: string }>;
  isOpen: boolean;
  onClose: () => void;
  viewingUsername?: string | null;
  clientUseFirestore: boolean;
  onViewProfileRequested?: (username: string) => void;
  onBackToMyProfile?: () => void;
}

const COMMON_EMOJIS = ["🍻", "🍺", "☕", "🍋", "🍊", "🍷", "🍹", "🥂", "🥃", "🍔", "🍕", "😎", "👾", "🦊", "🐼", "🦁", "👑"];

function getLocalDateString(dateInput: Date | string | number, timeZone: string): string {
  const d = new Date(dateInput);
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("Error formatting date for timezone:", timeZone, e);
  }
  const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

function getDayDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T12:00:00");
  const d2 = new Date(dateStr2 + "T12:00:00");
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function StatChip({ label, value, emoji, colorClass }: { label: string; value: string | number; emoji: string; colorClass: string }) {
  return (
    <div className={`rounded-xl p-2.5 flex flex-col items-center justify-center text-center border ${colorClass}`}>
      <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-base font-black mt-0.5 flex items-center gap-1">
        <span>{emoji}</span>
        <span>{value}</span>
      </span>
    </div>
  );
}

export default function UserProfileManager({
  users,
  currentUser,
  logs,
  onCurrentUserChanged,
  onProfileAddedOrUpdated,
  onProfileDeleted,
  onSelfAccountDeleted,
  isOpen,
  onClose,
  viewingUsername,
  clientUseFirestore,
  onViewProfileRequested,
  onBackToMyProfile
}: UserProfileManagerProps) {
  // My Profile Edit States
  const [myRealName, setMyRealName] = useState("");
  const [myEmail, setMyEmail] = useState("");
  const [myAvatar, setMyAvatar] = useState("🍻");
  const [myBio, setMyBio] = useState("");
  const [myPassword, setMyPassword] = useState("Pints!");
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [myError, setMyError] = useState<string | null>(null);
  const [mySuccess, setMySuccess] = useState(false);
  const [isUpdatingMyProfile, setIsUpdatingMyProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  const [loadedUsername, setLoadedUsername] = useState<string | null>(null);

  // Dynamic user stats from separate data path
  const [profileStats, setProfileStats] = useState<{
    totalPints: number;
    avgRating: string;
    favoriteStyle: string;
    totalCheers: number;
    benderCount: number;
    longestDrinkingStreak: number;
    longestDryStreak: number;
    currentDrinkingStreak: number;
    currentDryStreak: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Photo Cropper States
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPan, setCropPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editorImgSize, setEditorImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const cropImgRef = useRef<HTMLImageElement | null>(null);

  // Mouse & Touch events for profile photo cropping
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    dragStart.current = { x: e.clientX - cropPan.x, y: e.clientY - cropPan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return;
    setCropPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDraggingCrop(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDraggingCrop(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - cropPan.x, y: touch.clientY - cropPan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setCropPan({
        x: touch.clientX - dragStart.current.x,
        y: touch.clientY - dragStart.current.y
      });
    }
  };

  const handleApplyCrop = () => {
    if (!cropImgRef.current) return;
    const imgElement = cropImgRef.current;
    
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      
      // S maps from the 160px screen crop zone to 256px high-res canvas output
      const S = 256 / 160;
      
      const drawW = editorImgSize.width * cropZoom * S;
      const drawH = editorImgSize.height * cropZoom * S;
      
      const drawX = 128 + (cropPan.x * S) - (drawW / 2);
      const drawY = 128 + (cropPan.y * S) - (drawH / 2);
      
      ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
      
      try {
        const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        setMyPhotoUrl(croppedBase64);
        setCroppingImageSrc(null);
      } catch (err) {
        console.error("Canvas crop extraction failed:", err);
      }
    }
  };

  // Deletion confirm state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  // Self-service "delete my account" state
  const [showSelfDeleteForm, setShowSelfDeleteForm] = useState(false);
  const [selfDeletePassword, setSelfDeletePassword] = useState("");
  const [selfDeleteConfirmText, setSelfDeleteConfirmText] = useState("");
  const [selfDeleteError, setSelfDeleteError] = useState<string | null>(null);
  const [isDeletingSelf, setIsDeletingSelf] = useState(false);

  const handleSelfDeleteSubmit = async () => {
    setSelfDeleteError(null);
    setIsDeletingSelf(true);
    const result = await onSelfAccountDeleted(selfDeletePassword);
    setIsDeletingSelf(false);
    if (!result.success) {
      setSelfDeleteError(result.error || "Failed to delete your account.");
    }
    // On success the app logs the user out and unmounts this modal, so
    // there's no local state left to clean up here.
  };

  // Determine if we are in "Viewer Capacity" for another user
  const isViewOnly = !!viewingUsername && viewingUsername.toLowerCase() !== currentUser.toLowerCase();

  // Find the user we are currently displaying (either the viewed user or the active user)
  const displayedUsername = isViewOnly ? viewingUsername! : currentUser;
  const targetUser = users.find((u) => u.username.toLowerCase() === displayedUsername.toLowerCase()) || {
    username: displayedUsername,
    avatar: "🍻",
    favoriteStyle: "IPA",
    joinedDate: new Date().toISOString().split("T")[0],
    bio: "Pub member.",
    realName: displayedUsername
  };

  // Sync profile data when current user changes or modal opens
  useEffect(() => {
    if (isOpen && (loadedUsername !== currentUser || !prevOpen)) {
      const profile = users.find((u) => u.username === currentUser);
      if (profile) {
        setMyAvatar(profile.avatar || "🍻");
        setMyBio(profile.bio || "");
        setMyPassword(profile.password || "Pints!");
        setMyRealName(profile.realName || "");
        setMyEmail(profile.email || "");
        setMyPhotoUrl(profile.photoUrl || null);
        setLoadedUsername(currentUser);
        setIsEditing(false);
      }
    }
    if (isOpen && !prevOpen) {
      setShowSelfDeleteForm(false);
      setSelfDeletePassword("");
      setSelfDeleteConfirmText("");
      setSelfDeleteError(null);
    }
    setPrevOpen(isOpen);
  }, [currentUser, users, isOpen, prevOpen, loadedUsername]);

  // Handle Edit Profile submission
  const handleEditMyProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMyProfile(true);
    setMyError(null);
    setMySuccess(false);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: currentUser,
          favoriteStyle: "Other",
          avatar: myAvatar,
          bio: myBio.trim(),
          password: myPassword,
          realName: myRealName.trim() || undefined,
          email: myEmail.trim() || undefined,
          photoUrl: myPhotoUrl || undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile.");
      }

      const savedProfile = await response.json();
      onProfileAddedOrUpdated(savedProfile);
      setMySuccess(true);
      setTimeout(() => {
        setMySuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err: any) {
      setMyError(err.message || "An error occurred while saving profile changes.");
    } finally {
      setIsUpdatingMyProfile(false);
    }
  };

  // Load and calculate Profile Statistics on-demand when the profile modal opens
  useEffect(() => {
    if (!isOpen || !displayedUsername) {
      setProfileStats(null);
      return;
    }

    let isMounted = true;

    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(displayedUsername)}/stats`);
        if (!response.ok) {
          throw new Error("Failed to fetch user stats from server");
        }
        const data = await response.json();
        if (isMounted) {
          setProfileStats({
            totalPints: data.totalPints,
            avgRating: data.avgRating,
            favoriteStyle: data.favoriteStyle,
            totalCheers: data.totalCheers,
            benderCount: data.benderCount,
            longestDrinkingStreak: data.longestDrinkingStreak || 0,
            longestDryStreak: data.longestDryStreak || 0,
            currentDrinkingStreak: data.currentDrinkingStreak || 0,
            currentDryStreak: data.currentDryStreak || 0
          });
        }
      } catch (err: any) {
        console.error("Failed to load profile stats:", err);
        if (isMounted) {
          setStatsError(err.message || "Could not load stats.");
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [isOpen, displayedUsername, clientUseFirestore]);

  if (!isOpen) return null;

  const showEditForm = !isViewOnly && isEditing;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 min-w-0">
            {isViewOnly ? (
              <button
                onClick={onBackToMyProfile}
                title="Back to my profile"
                className="p-1 -ml-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all focus:outline-none cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Trophy className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            )}
            <h2 className="text-md font-bold text-slate-800 tracking-tight truncate">
              {isViewOnly ? `${targetUser.realName || targetUser.username}'s Profile` : "My Profile & Career Stats"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all focus:outline-none cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Admin Mode Display */}
          {isSeymoreBeers(currentUser) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-[11px] font-bold">
              🔓 <span className="font-extrabold text-emerald-950">Admin Mode Activated:</span> You are browsing as <span className="italic">Seymore Beers</span>. You can delete any pint check-ins or user profiles across the app.
            </div>
          )}

          {!showEditForm ? (
            /* VIEW PROFILE (EITHER OTHER USER OR SELF) */
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <UserAvatar username={targetUser.username} users={users} className="w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl border-2 border-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight truncate">
                      {targetUser.realName || targetUser.username}
                    </h3>
                    {!isViewOnly && (
                      <button
                        onClick={() => setIsEditing(true)}
                        title="Edit Profile"
                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-bold block">@{targetUser.username}</span>
                  <p className="text-xs text-slate-500 italic font-medium leading-snug mt-1.5 line-clamp-2">
                    "{targetUser.bio || "No bio added yet."}"
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                    <Calendar className="w-3 h-3 text-slate-300" />
                    <span>Joined {targetUser.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isViewOnly ? "Career Stats" : "My Career Stats"}
                </span>
                {loadingStats || !profileStats ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      {[1, 2].map((idx) => (
                        <div key={idx} className="bg-slate-100 rounded-2xl h-20 animate-pulse" />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className="bg-slate-100 rounded-xl h-16 animate-pulse" />
                      ))}
                    </div>
                  </div>
                ) : statsError ? (
                  <div className="text-xs text-red-500 font-semibold p-2 bg-red-50 rounded-lg">
                    ⚠️ {statsError}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Hero stats */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3.5 text-slate-950 shadow-md">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-950/60">Total Pints</span>
                        <div className="text-2xl sm:text-3xl font-black mt-0.5">🍺 {profileStats.totalPints}</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-300 to-yellow-500 rounded-2xl p-3.5 text-slate-950 shadow-md">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-950/60">Avg Rating</span>
                        <div className="text-2xl sm:text-3xl font-black mt-0.5">⭐ {profileStats.avgRating}</div>
                      </div>
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatChip
                        label="Beer/Day"
                        emoji="🍺"
                        colorClass="bg-amber-50 border-amber-100 text-amber-700"
                        value={(() => {
                          if (!profileStats || !profileStats.totalPints) return "0.0";
                          const joinedStr = targetUser.joinedDate || new Date().toISOString();
                          const joinedTime = new Date(joinedStr).getTime();
                          const diffMs = Date.now() - joinedTime;
                          const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                          return (profileStats.totalPints / diffDays).toFixed(1);
                        })()}
                      />
                      <StatChip
                        label="Bender Days"
                        emoji="🚨"
                        colorClass="bg-red-50 border-red-100 text-red-600"
                        value={profileStats.benderCount}
                      />
                      <StatChip
                        label="Longest Drink"
                        emoji="🔥"
                        colorClass="bg-orange-50 border-orange-100 text-orange-700"
                        value={`${profileStats.longestDrinkingStreak}d`}
                      />
                      <StatChip
                        label="Current Drink"
                        emoji="⚡"
                        colorClass="bg-emerald-50 border-emerald-100 text-emerald-700"
                        value={`${profileStats.currentDrinkingStreak}d`}
                      />
                      <StatChip
                        label="Longest Dry"
                        emoji="🐪"
                        colorClass="bg-sky-50 border-sky-100 text-sky-700"
                        value={`${profileStats.longestDryStreak}d`}
                      />
                      <StatChip
                        label="Current Dry"
                        emoji="🌵"
                        colorClass="bg-cyan-50 border-cyan-100 text-cyan-700"
                        value={`${profileStats.currentDryStreak}d`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Friends management */}
              {!isViewOnly && (
                <div className="pt-2">
                  <FriendsHub
                    currentUser={currentUser}
                    users={users}
                    onProfileAddedOrUpdated={onProfileAddedOrUpdated}
                    onViewProfileRequested={onViewProfileRequested}
                  />
                </div>
              )}

              {/* Self-service account deletion */}
              {!isViewOnly && (
                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danger Zone
                  </span>
                  {!showSelfDeleteForm ? (
                    <button
                      type="button"
                      onClick={() => setShowSelfDeleteForm(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete My Account
                    </button>
                  ) : (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs space-y-3">
                      <div>
                        <p className="text-red-700 font-bold">⚠️ Delete your account permanently?</p>
                        <p className="text-red-600 text-[11px] font-normal leading-relaxed mt-1">
                          This deletes your profile and every pint you've logged. You'll be removed from
                          any friends lists. This cannot be undone.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="self-delete-password" className="text-[9px] text-red-500 font-bold uppercase block">
                          Enter your password
                        </label>
                        <input
                          id="self-delete-password"
                          type="password"
                          placeholder="Your account password"
                          value={selfDeletePassword}
                          onChange={(e) => setSelfDeletePassword(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-red-200 rounded bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="self-delete-confirm" className="text-[9px] text-red-500 font-bold uppercase block">
                          Type <span className="underline font-extrabold">DELETE</span> to confirm
                        </label>
                        <input
                          id="self-delete-confirm"
                          type="text"
                          placeholder="DELETE"
                          value={selfDeleteConfirmText}
                          onChange={(e) => setSelfDeleteConfirmText(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-red-200 rounded bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      {selfDeleteError && (
                        <p className="text-red-700 font-semibold text-[11px]">{selfDeleteError}</p>
                      )}

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={selfDeleteConfirmText !== "DELETE" || !selfDeletePassword || isDeletingSelf}
                          onClick={handleSelfDeleteSubmit}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded cursor-pointer transition-colors text-[11px] shrink-0"
                        >
                          {isDeletingSelf ? "Deleting..." : "Permanently Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSelfDeleteForm(false);
                            setSelfDeletePassword("");
                            setSelfDeleteConfirmText("");
                            setSelfDeleteError(null);
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer transition-colors text-[11px] shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin-only: full user directory with delete capability */}
              {!isViewOnly && isSeymoreBeers(currentUser) && (
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    🔓 Admin: All Users ({users.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {users.map((user) => (
                      <div
                        key={user.username}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserAvatar username={user.username} users={users} className="w-8 h-8 border border-slate-200" />
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-slate-800 text-xs truncate block">
                              {user.realName || user.username}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold truncate block">@{user.username}</span>
                          </div>
                          {users.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmUser(user.username);
                                setConfirmInput("");
                              }}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors focus:outline-none shrink-0"
                              title={`Delete ${user.username}'s profile`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Safe Double-Confirmation Area */}
                        {deleteConfirmUser === user.username && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
                            <p className="text-red-700 font-bold">⚠️ Confirm Deletion</p>
                            <p className="text-red-600 text-[11px] font-normal leading-relaxed">
                              This deletes this profile and all their logged pints permanently.
                            </p>
                            <div className="space-y-1">
                              <label className="text-[9px] text-red-500 font-bold uppercase block">
                                Type <span className="underline font-extrabold">{user.username}</span> to confirm:
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder={`Type ${user.username}`}
                                  value={confirmInput}
                                  onChange={(e) => setConfirmInput(e.target.value)}
                                  className="w-full px-2 py-1 border border-red-200 rounded bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                                <button
                                  type="button"
                                  disabled={confirmInput !== user.username}
                                  onClick={async () => {
                                    await onProfileDeleted(user.username);
                                    setDeleteConfirmUser(null);
                                    setConfirmInput("");
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded cursor-pointer transition-colors text-[11px] shrink-0"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteConfirmUser(null);
                                    setConfirmInput("");
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer transition-colors text-[11px] shrink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EDIT OWN ACTIVE PROFILE */
            <div className="space-y-6">
              <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-amber-200/40 pb-2">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                    Edit Pub Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Cancel / Back
                  </button>
                </div>

                <form onSubmit={handleEditMyProfileSubmit} className="space-y-4">
                  {/* Photo Upload Zone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      My Profile Photo (Optional - Replaces Emoji)
                    </label>
                    <div className="space-y-2">
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setCroppingImageSrc(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() => document.getElementById("profile-photo-input")?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-white hover:bg-amber-50/10 flex flex-col items-center justify-center gap-1.5 shadow-sm"
                      >
                        {myPhotoUrl ? (
                          <div className="relative w-16 h-16 group">
                            <img
                              src={myPhotoUrl}
                              alt="Profile"
                              className="w-16 h-16 rounded-full object-cover border border-amber-500 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[9px] text-white font-bold uppercase">Change</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <Smile className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              <span className="text-amber-600 font-bold">Drag & drop</span> or click to upload
                            </p>
                            <p className="text-[9px] text-slate-400">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                      <input
                        id="profile-photo-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setCroppingImageSrc(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {myPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setMyPhotoUrl(null)}
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider block hover:underline"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emoji Picker */}
                  {!myPhotoUrl && (
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">My Profile Avatar Emoji</span>
                      <div className="flex flex-wrap gap-2 bg-white border border-slate-200/60 rounded-xl p-3 shadow-inner">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setMyAvatar(emoji)}
                            className={`text-xl w-9 h-9 flex items-center justify-center rounded-md border transition-all hover:bg-amber-50 cursor-pointer ${
                              myAvatar === emoji
                                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
                                : "border-slate-100 bg-slate-50/35"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Real Name */}
                    <div>
                      <label htmlFor="my-real-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        My Real Name
                      </label>
                      <input
                        id="my-real-name-input"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={myRealName}
                        onChange={(e) => setMyRealName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="my-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="my-email-input"
                        type="email"
                        placeholder="quin@beerreal.com"
                        value={myEmail}
                        onChange={(e) => setMyEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 transition-all"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="my-bio-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        My Bio
                      </label>
                      <input
                        id="my-bio-input"
                        type="text"
                        placeholder="IPA expert..."
                        value={myBio}
                        onChange={(e) => setMyBio(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="my-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Profile Password
                      </label>
                      <input
                        id="my-password-input"
                        type="password"
                        placeholder="Default is Pints!"
                        value={myPassword}
                        onChange={(e) => setMyPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {myError && (
                    <div className="text-red-600 text-xs font-semibold">{myError}</div>
                  )}
                  {mySuccess && (
                    <div className="text-green-600 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Profile updated successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingMyProfile}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    {isUpdatingMyProfile ? "Saving Changes..." : "Save My Profile Changes"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-sm focus:outline-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* Cropping Modal Overlay */}
      <AnimatePresence>
        {croppingImageSrc && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Crop Your Profile Photo ✂️
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Drag the photo to pan, use the slider to zoom.
                </p>
              </div>

              {/* Cropping box */}
              <div className="flex justify-center">
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="w-[280px] h-[280px] relative overflow-hidden bg-slate-950 rounded-xl select-none cursor-grab active:cursor-grabbing border border-slate-700 shadow-inner"
                >
                  <img
                    ref={cropImgRef}
                    src={croppingImageSrc}
                    alt="Crop target"
                    className="absolute pointer-events-none max-w-none origin-center"
                    style={{
                      width: editorImgSize.width,
                      height: editorImgSize.height,
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${cropPan.x}px), calc(-50% + ${cropPan.y}px)) scale(${cropZoom})`,
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const aspect = img.naturalWidth / img.naturalHeight;
                      let dWidth = 280;
                      let dHeight = 280;
                      if (aspect > 1) {
                        dHeight = 280;
                        dWidth = 280 * aspect;
                      } else {
                        dWidth = 280;
                        dHeight = 280 / aspect;
                      }
                      setEditorImgSize({ width: dWidth, height: dHeight });
                      setCropPan({ x: 0, y: 0 });
                      setCropZoom(1);
                    }}
                  />
                  {/* Circle Mask Overlay */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 280">
                    <defs>
                      <mask id="crop-mask">
                        <rect width="280" height="280" fill="white" />
                        <circle cx="140" cy="140" r="80" fill="black" />
                      </mask>
                    </defs>
                    <rect width="280" height="280" fill="black" fillOpacity="0.65" mask="url(#crop-mask)" />
                    <circle cx="140" cy="140" r="80" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeDasharray="5 3" />
                  </svg>
                </div>
              </div>

              {/* Slider zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom Out</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                    {Math.round(cropZoom * 100)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <span>Zoom In</span>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.02"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCroppingImageSrc(null)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/10"
                >
                  Apply Crop 🍻
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
