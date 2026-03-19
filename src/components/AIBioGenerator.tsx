"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  name: string;
  skill: string;
  state: string;
  onGenerated: (bio: string) => void;
};

export default function AIBioGenerator({ name, skill, state, onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [experience, setExperience] = useState("");
  const [strength, setStrength] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition";

  async function handleGenerate() {
    if (!experience.trim() || !strength.trim()) {
      setError("Please fill in both fields");
      return;
    }
    if (!name.trim() || !skill.trim()) {
      setError("Please fill in your name and skill title first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skill, experience, strength, state }),
      });
      const data = await res.json();
      if (data.bio) {
        onGenerated(data.bio);
        setOpen(false);
        setExperience("");
        setStrength("");
      } else {
        setError("Failed to generate bio. Try again.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">Professional Bio</label>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition cursor-pointer border-none"
        >
          ✨ Write with AI
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-3 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-sm font-semibold text-purple-800">AI Bio Generator</p>
                  <p className="text-xs text-purple-500">Answer 2 quick questions and Claude will write your bio</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-purple-700">Years of experience</label>
                <input
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="e.g. 3 years, 5+ years"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-purple-700">Your top strength or speciality</label>
                <input
                  value={strength}
                  onChange={e => setStrength(e.target.value)}
                  placeholder="e.g. building fast React apps, logo design for startups"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      ⟳
                    </motion.span>
                    Generating your bio...
                  </span>
                ) : "Generate Bio →"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
