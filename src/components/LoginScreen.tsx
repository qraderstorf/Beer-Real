import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User, Mail, PlusCircle, Smile, Sparkles, AlertCircle, Eye, EyeOff, Beer, ZoomIn, ZoomOut } from "lucide-react";
import { UserProfile } from "../types";
import { compressImage } from "../utils";
import Logo from "./Logo";

interface LoginScreenProps {
  users: UserProfile[];
  onLoginSuccess: (username: string) => void;
  onProfileCreated: (newProfile: UserProfile) => void;
}

const COMMON_STYLES = ["IPA", "Hazy IPA", "Stout", "Sour", "Pilsner", "Lager", "Saison", "Porter", "Wheat", "Amber Ale"];
const EMOJI_AVATARS = ["🍻", "☕", "🍋", "🍺", "🍊", "🍇", "🍒", "🍍", "🥨", "🍕", "🔥", "✨", "🕶️", "🦁"];

export default function LoginScreen({ users, onLoginSuccess, onProfileCreated }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register state
  const [newRealName, setNewRealName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFavoriteStyle, setNewFavoriteStyle] = useState("IPA");
  const [newAvatar, setNewAvatar] = useState("🍻");
  const [newBio, setNewBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);

  // Photo Cropper States for Signup
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
      
      const S = 256 / 160;
      const drawW = editorImgSize.width * cropZoom * S;
      const drawH = editorImgSize.height * cropZoom * S;
      
      const drawX = 128 + (cropPan.x * S) - (drawW / 2);
      const drawY = 128 + (cropPan.y * S) - (drawH / 2);
      
      ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
      
      try {
        const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        setNewPhotoUrl(croppedBase64);
        setCroppingImageSrc(null);
      } catch (err) {
        console.error("Canvas crop extraction failed:", err);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Please enter your username or email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: selectedUser, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      onLoginSuccess(data.user.username);
    } catch (err: any) {
      setError(err.message || "Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (!newPassword) {
      setError("Please specify a password.");
      return;
    }
    if (!newPhotoUrl) {
      setError("Please upload a profile picture. A photo is required to sign up.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First verify if username already exists
      const duplicate = users.some(
        (u) => u.username.toLowerCase() === newUsername.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error("Username already taken. Please choose a different name.");
      }

      // Verify if email already exists if provided
      if (newEmail.trim()) {
        const duplicateEmail = users.some(
          (u) => u.email && u.email.toLowerCase() === newEmail.trim().toLowerCase()
        );
        if (duplicateEmail) {
          throw new Error("This email address is already associated with another account.");
        }
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          favoriteStyle: newFavoriteStyle,
          avatar: newAvatar,
          bio: newBio.trim(),
          password: newPassword,
          realName: newRealName.trim() || undefined,
          photoUrl: newPhotoUrl || undefined,
          email: newEmail.trim() || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Automatically log them in after registration
      onProfileCreated(data);
      onLoginSuccess(data.username);
    } catch (err: any) {
      setError(err.message || "Could not register profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 pt-safe">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <Logo size="lg" className="justify-center mb-3" />
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Check in, rate pints, and see what your friends are drinking.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold">Authentication issue</p>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegistering
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegistering
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Profile
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!isRegistering ? (
              /* SIGN IN FORM */
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5"
              >
                {/* Username or email input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Username / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={selectedUser}
                      onChange={(e) => {
                        setSelectedUser(e.target.value);
                        setError(null);
                      }}
                      placeholder="Username or email address"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Default is Pints!"
                      className="block w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 leading-relaxed font-medium">
                    💡 For existing accounts, try entering <span className="font-bold text-slate-600">Pints!</span>
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Enter Pub 🍻"}
                  </button>
                </div>
              </motion.form>
            ) : (
              /* CREATE PROFILE / REGISTER FORM */
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Your Real Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={30}
                      value={newRealName}
                      onChange={(e) => setNewRealName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Desired Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      value={newUsername}
                      onChange={(e) => {
                        // strip spaces, allow only letters/numbers/underscores
                        const cleanVal = e.target.value.replace(/[^a-zA-Z0-9_\-\s]/g, "");
                        setNewUsername(cleanVal);
                      }}
                      placeholder="e.g. Seymore Beers"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. quin@beerreal.com"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Choose Avatar Emoji
                  </label>
                  <select
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-lg"
                  >
                    {EMOJI_AVATARS.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Profile Picture (Required)
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
                      onClick={() => document.getElementById("register-photo-input")?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-amber-50/10 flex flex-col items-center justify-center gap-1.5"
                    >
                      {newPhotoUrl ? (
                        <div className="relative w-16 h-16 group">
                          <img
                            src={newPhotoUrl}
                            alt="Preview"
                            className="w-16 h-16 rounded-full object-cover border border-amber-500 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[9px] text-white font-bold uppercase">Change</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Smile className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            <span className="text-amber-600 font-bold">Drag & drop</span> or click to upload
                          </p>
                          <p className="text-[9px] text-slate-400">PNG, JPG up to 5MB (with Cropping)</p>
                        </>
                      )}
                    </div>
                    <input
                      id="register-photo-input"
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
                    {newPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setNewPhotoUrl(null)}
                        className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider block hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Bio (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Short bio about your palate..."
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a password"
                      className="block w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 leading-relaxed font-medium">
                    🔐 Pick a password to secure your check-ins and deletions!
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Profile & Join 🍻"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cropping Modal Overlay */}
      <AnimatePresence>
        {croppingImageSrc && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 text-left"
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
