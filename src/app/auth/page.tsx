"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/utils/auth";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } =
            mode === "login"
                ? await signIn(email, password)
                : await signUp(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push(mode === "signup" ? "/register" : "/");
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-6 py-10 font-sans">
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] w-full max-w-md px-10 py-12">

                {/* Brand */}
                <div className="flex items-center gap-2 mb-8">
                    <span className="w-8 h-8 bg-green-700 text-white font-extrabold text-base rounded-lg flex items-center justify-center">
                        S
                    </span>
                    <span className="font-bold text-lg text-slate-900 tracking-tight">SkillFind</span>
                    <span className="text-lg">🇳🇬</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-slate-400 mb-8">
                    {mode === "login"
                        ? "Sign in to manage your profile"
                        : "Join thousands of Nigerian freelancers"}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 placeholder:text-slate-300 transition"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            required
                            className="px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 placeholder:text-slate-300 transition"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-2.5 rounded-lg">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? <span className="flex items-center justify-center gap-2">Sign In <LogIn size={18} /></span>
                                : <span className="flex items-center justify-center gap-2">Create Account <UserPlus size={18} /></span>}
                    </button>
                </form>

                {/* Toggle */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="text-green-700 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                        onClick={() => {
                            setMode(mode === "login" ? "signup" : "login");
                            setError("");
                        }}
                    >
                        {mode === "login" ? "Sign Up" : "Sign In"}
                    </button>
                </p>
            </div>
        </div>
    );
}
