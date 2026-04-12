"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Loader2 } from "lucide-react";

type Props = {
  skill: string;
  category: string;
  state: string;
  onApply: (rate: string) => void;
};

export default function AIPriceSuggester({ skill, category, state, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  async function handleSuggest() {
    if (!experience.trim()) { setError("Please enter your experience level"); return; }
    if (!skill.trim()) { setError("Please fill in your skill title first"); return; }

    setLoading(true);
    setError("");
    setSuggestion("");

    try {
      const res = await fetch("/api/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, category, experience, state }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        setError(data.error || "Failed to get suggestion. Try again.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">Rate (₦)</label>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setOpen(!open); setSuggestion(""); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer border-none"
        >
          <Lightbulb size={14} /> Suggest a Rate
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
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-3 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-blue-800">AI Rate Suggester</p>
                  <p className="text-xs text-blue-500">Get a fair market rate based on your skill and location</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-blue-700">Your experience level</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select experience level</option>
                  <option value="beginner (0-1 years)">Beginner (0–1 years)</option>
                  <option value="intermediate (2-4 years)">Intermediate (2–4 years)</option>
                  <option value="experienced (5-7 years)">Experienced (5–7 years)</option>
                  <option value="expert (8+ years)">Expert (8+ years)</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Suggestion result */}
              <AnimatePresence>
                {suggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-blue-200 rounded-xl p-4"
                  >
                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><Lightbulb size={14} /> Suggested Rate</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{suggestion}</p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Extract just the hourly line and clean it up
                        const lines = suggestion.split("\n").filter(l => l.trim());
                        const hourlyLine = lines.find(l => l.toLowerCase().includes("hourly"));
                        
                        if (hourlyLine) {
                          // Remove "Hourly:" prefix, keep just the rate value
                          const cleaned = hourlyLine
                            .replace(/hourly:/i, "")
                            .trim();
                          onApply(cleaned);
                        } else {
                          onApply(lines[0]);
                        }
                        
                        setOpen(false);
                        setSuggestion("");
                      }}
                      className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer border-none"
                    >
                      Use This Rate →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!suggestion && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSuggest}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        <Loader2 size={16} />
                      </motion.span>
                      Checking market rates...
                    </span>
                  ) : "Get Rate Suggestion →"}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
