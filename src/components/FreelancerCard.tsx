"use client";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Freelancer } from "@/types";
import { getCategoryColor, getInitials, formatRate } from "@/utils/helpers";
import { motion } from "framer-motion";

interface FreelancerCardProps {
  freelancer: Freelancer;
  onClick: () => void;
}

export default function FreelancerCard({ freelancer, onClick }: FreelancerCardProps) {
  const { bg, text } = getCategoryColor(freelancer.category);
  return (
    <motion.div
      className="bg-white border border-slate-200 hover:border-green-200 rounded-2xl p-6 flex flex-col gap-2 cursor-pointer transition-colors duration-200 h-full"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-1">
        {freelancer.avatar_url ? (
          <Image
            src={freelancer.avatar_url} alt={freelancer.name}
            width={44} height={44}
            className="w-11 h-11 rounded-xl object-cover"
          />
        ) : (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${bg} ${text}`}>
            {getInitials(freelancer.name)}
          </div>
        )}
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${bg} ${text}`}
        >
          {freelancer.category}
        </motion.span>
      </div>
      <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-[17px] text-slate-900 line-clamp-1">{freelancer.name}</h3>
      <p className="text-[13px] font-medium text-green-700 line-clamp-1">{freelancer.skill}</p>
      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mt-1">{freelancer.bio}</p>
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-900">{formatRate(freelancer.rate)}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MapPin size={12} /> {freelancer.state}
        </span>
      </div>
    </motion.div>
  );
}
