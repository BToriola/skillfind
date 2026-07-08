"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, resetPassword, signInWithGoogle } from "@/utils/auth";
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

type Mode = "login" | "signup" | "forgot";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "login" ? "login" :
    searchParams.get("mode") === "forgot" ? "forgot" : "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      if (error) { toast.error(error.message); setLoading(false); return; }
      setResetSent(true);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await signUp(email, password, fullName, businessName);
      if (error) { toast.error(error.message); setLoading(false); return; }

      // If signup, show email confirmation message instead of redirecting
      setResetSent(true); // reuse the same "check email" screen
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { data, error } = await signIn(email, password);
      if (error) { toast.error(error.message); setLoading(false); return; }

      // Check if user has a freelancer profile
      const { data: profile } = await supabase
        .from("freelancers")
        .select("id")
        .eq("user_id", data.user!.id)
        .single();

      if (!profile) {
        // New user — send them to register with a welcome flag
        router.push("/register?welcome=true");
      } else {
        // Existing user — send them home
        router.push("/");
      }
      router.refresh();
      return;
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setResetSent(false);
    setFullName("");
    setBusinessName("");
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-bricolage font-bold text-lg text-slate-900">SkillFind</span>
          <span>🇳🇬</span>
        </div>

        {/* Check email screen — used for both signup confirmation and password reset */}
        {resetSent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-bricolage text-xl font-bold text-slate-900 mb-2">
              Check your email
            </h2>
            <p className="text-sm text-slate-500 mb-2">
              {mode === "signup"
                ? "We sent a confirmation link to"
                : "We sent a password reset link to"}
            </p>
            <p className="text-sm font-semibold text-slate-700 mb-4">{email}</p>
            <p className="text-sm text-slate-500 mb-6">
              {mode === "signup"
                ? "Click the link in your email to verify your account before signing in."
                : "Click the link in your email to reset your password."}
            </p>
            <button
              onClick={() => { switchMode("login"); setResetSent(false); }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-bricolage text-2xl font-bold text-slate-900 mb-1">
              {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password"}
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              {mode === "signup" ? "Join thousands of Nigerian freelancers" :
               mode === "login" ? "Sign in to manage your profile" :
               "Enter your email and we'll send you a reset link"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Signup only fields */}
              {mode === "signup" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text" value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Babatunde Adenrele" required
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Business Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text" value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Adenrele Studios"
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-500">Leave blank if you&apos;re an individual freelancer</p>
                  </div>
                </>
              )}

              {mode !== "forgot" && (
                <>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={googleLoading}
                    onClick={async () => {
                      setGoogleLoading(true);
                      await signInWithGoogle();
                    }}
                    className="w-full py-3 flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-slate-700 font-medium text-sm rounded-xl transition cursor-pointer disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <span className="text-slate-400">Redirecting to Google...</span>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
                          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className={inputClass}
                />
              </div>

              {/* Password — hidden on forgot mode */}
              {mode !== "forgot" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-green-600 hover:text-green-700 font-medium bg-transparent border-none cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                      minLength={mode === "signup" ? 8 : undefined}
                      required
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}



              <button
                type="submit" disabled={loading}
                className="mt-1 w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                {loading ? "Please wait..." :
                 mode === "signup" ? "Create Account →" :
                 mode === "login" ? "Sign In →" :
                 "Send Reset Link →"}
              </button>
            </form>

            {/* Mode switcher */}
            <div className="text-center text-sm text-slate-500 mt-6 flex flex-col gap-2">
              {mode === "signup" && (
                <p>Already have an account?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Sign In
                  </button>
                </p>
              )}
              {mode === "login" && (
                <p>Don&apos;t have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Sign Up Free
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <p>Remember your password?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
