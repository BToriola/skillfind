"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function FreelancerNotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center">
        <Search className="text-slate-300 mb-4" size={64} />
        <h1 className="font-bricolage text-2xl font-bold text-slate-900 mb-2">
          Freelancer Not Found
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          This profile may have been removed or the link is incorrect.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer border-none"
        >
          Browse Directory →
        </button>
      </div>
    </div>
  );
}
