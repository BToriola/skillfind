"use client";

import { motion } from "framer-motion";
import { Check, Circle, Sparkles } from "lucide-react";
import { Freelancer } from "@/types";
import { getProfileStrength } from "@/utils/profileStrength";

type Props = {
  freelancer: Freelancer;
  portfolioCount: number;
  /** Jumps to the portfolio card and opens the add-project form. */
  onAddProject: () => void;
};

export default function ProfileStrength({ freelancer, portfolioCount, onAddProject }: Props) {
  const { percent, items, topMissing, isComplete } = getProfileStrength(freelancer, portfolioCount);

  // The bar earns green only at 100% — an amber bar at 70% reads as
  // "not finished yet", which a green one at 70% actively hides.
  const barColor =
    percent >= 100 ? "bg-green-500" : percent >= 60 ? "bg-amber-400" : "bg-orange-400";

  if (isComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
        <span className="w-9 h-9 shrink-0 bg-green-600 text-white rounded-full flex items-center justify-center">
          <Check size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-green-800">Profile 100% complete</p>
          <p className="text-xs text-green-700">
            You&apos;ll show up ahead of half-finished profiles. Keep your projects fresh.
          </p>
        </div>
      </div>
    );
  }

  const isPortfolioMissing =
    topMissing?.key === "portfolio" || topMissing?.key === "portfolio_more";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex items-end justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Profile strength</p>
          <p className="text-xs text-slate-500">
            Complete profiles get contacted far more often than empty ones
          </p>
        </div>
        <span className="font-bricolage font-bold text-2xl text-slate-900 leading-none shrink-0">
          {percent}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Next step */}
      {topMissing && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
              Next step
            </p>
            <p className="text-sm text-slate-800">
              {topMissing.cta}{" "}
              <span className="text-slate-400">
                (+{topMissing.weight}% → {percent + topMissing.weight}%)
              </span>
            </p>
          </div>
          {isPortfolioMissing && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onAddProject}
              className="shrink-0 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <Sparkles size={15} /> Add a project
            </motion.button>
          )}
        </div>
      )}

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            {item.done ? (
              <Check size={15} className="text-green-600 shrink-0" />
            ) : (
              <Circle size={15} className="text-slate-300 shrink-0" />
            )}
            <span
              className={`text-xs ${item.done ? "text-slate-400 line-through" : "text-slate-600"}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
