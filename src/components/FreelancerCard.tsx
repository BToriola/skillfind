"use client";
import { useRouter } from "next/navigation";
import { Freelancer } from "@/types";
import { getInitials, formatPricing, getCategoryColor, formatLocation } from "@/utils/helpers";
import { motion } from "framer-motion";
import { Briefcase, MapPin } from "lucide-react";

export default function FreelancerCard({ freelancer, onClick }: { freelancer: Freelancer; onClick: () => void }) {
  const router = useRouter();
  const { bg, text } = getCategoryColor(freelancer.category);
  const avatarColor = `${bg} ${text}`;
  const badgeColor = avatarColor;

  function handleClick() {
    if (freelancer.slug) {
      router.push(`/freelancer/${freelancer.slug}`);
    } else {
      onClick();
    }
  }

  const hasLocation = !!freelancer.state?.trim();
  const hasBio = !!freelancer.bio?.trim();
  const projectCount = freelancer.portfolio_count ?? 0;

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white border border-gray-200 hover:border-green-200 rounded-2xl p-6 cursor-pointer flex flex-col"
    >
      {/* Top row — the category can truncate, the badges can't: they're the
          two signals a client scans the grid for. */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full truncate ${badgeColor}`}>
          {freelancer.category}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {projectCount > 0 && (
            <span
              // Reads as "shows real work" at a glance, and is the visible
              // half of the portfolio ranking — an empty listing simply has
              // nothing here rather than being marked as lacking.
              aria-label={`${projectCount} project${projectCount === 1 ? "" : "s"} in portfolio`}
              className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
            >
              <Briefcase size={11} /> {projectCount}
            </span>
          )}
          {freelancer.is_verified && (
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full whitespace-nowrap">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Skill headline — capped at 2 lines no matter what someone typed */}
      <h3 className="font-bricolage font-bold text-lg text-slate-900 leading-snug line-clamp-2">
        {freelancer.skill}
      </h3>

      {/* Name */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        {freelancer.avatar_url ? (
          <img src={freelancer.avatar_url} alt={freelancer.name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor}`}>
            {getInitials(freelancer.name)}
          </div>
        )}
        <span className="text-sm text-slate-500">{freelancer.name}</span>
      </div>

      {/* Bio — soaks up remaining space so footer aligns across cards */}
      <p className={`text-sm leading-relaxed line-clamp-2 flex-1 ${hasBio ? "text-slate-500" : "text-slate-300 italic"}`}>
        {hasBio ? freelancer.bio : "No bio added yet"}
      </p>

      {/* Footer — always pinned to bottom, color restored here.
          City/State together can run much longer than a state name alone
          ("Oluyole Estate. Ibadan, Oyo" vs "Oyo"), and this row never had a
          width limit on it — it just wrapped to a second line and broke the
          single-line footer every other card in the grid keeps to. max-w
          + truncate caps it at roughly half the row and ellipsizes instead. */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
        <span className="text-sm font-bold text-green-600 shrink-0">
          {formatPricing(freelancer.rate_type, freelancer.rate_min, freelancer.rate_max, freelancer.rate)}
        </span>
        {hasLocation && (
          <span className="text-xs text-slate-400 flex items-center gap-1 min-w-0 max-w-[55%]">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{formatLocation(freelancer.city, freelancer.state)}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
