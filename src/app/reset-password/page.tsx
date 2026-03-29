"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition";

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    // This fires when the user lands on this page via the reset email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
      }
    });

    // Also check if there's already an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) { setError(error.message); setLoading(false); return; }

    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-bricolage font-bold text-lg text-slate-900">SkillFind</span>
          <span>🇳🇬</span>
        </div>

        {/* Success state */}
        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
            <h2 className="font-bricolage text-xl font-bold text-slate-900 mb-2">Password Updated!</h2>
            <p className="text-sm text-slate-400">Taking you to the homepage...</p>
          </div>

        /* Waiting for session from email link */
        ) : !sessionReady ? (
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">🔐</div>
            <h2 className="font-bricolage text-xl font-bold text-slate-900 mb-2">Verifying your link...</h2>
            <p className="text-sm text-slate-400 mb-6">
              Please wait while we verify your reset link. This only takes a second.
            </p>
            <p className="text-xs text-slate-300">
              If nothing happens, your link may have expired.{" "}
              <button
                onClick={() => router.push("/auth?mode=forgot")}
                className="text-green-600 hover:underline bg-transparent border-none cursor-pointer"
              >
                Request a new one
              </button>
            </p>
          </div>

        /* Ready — show the form */
        ) : (
          <>
            <h1 className="font-bricolage text-2xl font-bold text-slate-900 mb-1">
              Set new password
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Choose a strong password for your SkillFind account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" required
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

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your new password" required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition bg-transparent border-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="mt-1 w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
              >
                {loading ? "Updating password..." : "Update Password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
