"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, resetPassword } from "@/utils/auth";
import { Eye, EyeOff } from "lucide-react";

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
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      if (error) { setError(error.message); setLoading(false); return; }
      setResetSent(true);
      setLoading(false);
      return;
    }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, fullName, businessName);

    if (error) { setError(error.message); setLoading(false); return; }
    router.push(mode === "signup" ? "/register" : "/");
    router.refresh();
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError("");
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

        {/* Reset sent confirmation */}
        {resetSent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-bricolage text-xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-sm text-slate-400 mb-6">
              We sent a password reset link to <span className="font-medium text-slate-700">{email}</span>. Check your inbox and click the link to reset your password.
            </p>
            <button
              onClick={() => switchMode("login")}
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
            <p className="text-sm text-slate-400 mb-8">
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
                    <p className="text-xs text-slate-400">Leave blank if you're an individual freelancer</p>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                  {error}
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
            <div className="text-center text-sm text-slate-400 mt-6 flex flex-col gap-2">
              {mode === "signup" && (
                <p>Already have an account?{" "}
                  <button onClick={() => switchMode("login")} className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none">
                    Sign In
                  </button>
                </p>
              )}
              {mode === "login" && (
                <p>Don't have an account?{" "}
                  <button onClick={() => switchMode("signup")} className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none">
                    Sign Up
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <p>Remember your password?{" "}
                  <button onClick={() => switchMode("login")} className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none">
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
