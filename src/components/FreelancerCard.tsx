"use client";
import { useRouter } from "next/navigation";
import { Freelancer } from "@/types";
import { getInitials, formatRate, getCategoryColor, formatLocation } from "@/utils/helpers";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

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
  const hasRate = !!freelancer.rate?.trim();
  const hasBio = !!freelancer.bio?.trim();

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white border border-gray-200 hover:border-green-200 rounded-2xl p-6 cursor-pointer flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
          {freelancer.category}
        </span>
        {freelancer.is_verified && (
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            ✓ Verified
          </span>
        )}
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
          {hasRate ? formatRate(freelancer.rate) : "Rate on request"}
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
