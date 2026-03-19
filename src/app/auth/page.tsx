"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/utils/auth";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = mode === "login"
            ? await signIn(email, password)
            : await signUp(email, password, fullName, businessName);

        if (error) { setError(error.message); setLoading(false); return; }
        router.push(mode === "signup" ? "/register" : "/");
        router.refresh();
    }

    function switchMode() {
        setMode(mode === "login" ? "signup" : "login");
        setError("");
        setFullName("");
        setBusinessName("");
    }

    const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition";

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-2xl p-10">

                {/* Brand */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
                    <span className="font-bold text-lg text-slate-900">SkillFind</span>
                    <span>🇳🇬</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-slate-400 mb-8">
                    {mode === "login" ? "Sign in to manage your profile" : "Join thousands of Nigerian freelancers"}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Signup-only fields */}
                    {mode === "signup" && (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    placeholder="e.g. Babatunde Adenrele" required
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">
                                    Business Name <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
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
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com" required
                            className={inputClass}
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                                minLength={mode === "signup" ? 8 : undefined}
                                required
                                className={`${inputClass} pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none p-1 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                        className="mt-1 w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
                    >
                        {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={switchMode} className="text-green-600 font-semibold hover:underline cursor-pointer bg-transparent border-none">
                        {mode === "login" ? "Sign Up" : "Sign In"}
                    </button>
                </p>
            </div>
        </div>
    );
}
