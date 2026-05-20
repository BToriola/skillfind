"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageCircle,
  ExternalLink,
  Play,
  Pencil,
  Check,
  Share2,
  MapPin,
  Zap,
} from "lucide-react";
import { Freelancer } from "@/types";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import PortfolioSection from "@/components/PortfolioSection";

type Review = {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { email: string };
};

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Writing: "bg-yellow-100 text-yellow-700",
  Marketing: "bg-orange-100 text-orange-700",
  Trades: "bg-green-100 text-green-700",
  Photography: "bg-purple-100 text-purple-700",
  Education: "bg-cyan-100 text-cyan-700",
  Other: "bg-slate-100 text-slate-600",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatRate(rate: string) {
  if (!rate) return rate;
  const trimmed = rate.trim();
  if (trimmed.includes("₦")) return trimmed;
  return `₦${trimmed}`;
}

function formatWhatsApp(number: string) {
  const cleaned = number.replace(/\D/g, "");
  const international = cleaned.startsWith("0") ? "234" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${international}`;
}

function StarRating({
  rating,
  onRate,
  readonly = true,
  size = 16,
}: {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition border-none bg-transparent ${readonly ? "cursor-default" : "cursor-pointer"
            }`}
        >
          <Star
            size={size}
            className={
              star <= (hovered || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-200 fill-transparent"
            }
          />
        </button>
      ))}
    </div>
  );
}

function BioText({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > 220;
  return (
    <div>
      <p className="text-sm text-slate-600 leading-[1.85]">
        {isLong && !expanded ? bio.slice(0, 220) + "…" : bio}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-green-600 font-semibold mt-2 bg-transparent border-none cursor-pointer hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function SkillChips({ skill }: { skill: string }) {
  const chips = skill
    .split(/[,/]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (chips.length <= 1 && chips[0] === skill.trim()) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {chips.map(chip => (
        <span
          key={chip}
          className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

export default function FreelancerProfileClient({
  freelancer,
}: {
  freelancer: Freelancer;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const badgeColor = CATEGORY_COLORS[freelancer.category] || CATEGORY_COLORS.Other;
  const isOwnProfile = user?.id === freelancer.user_id;
  const canReview = user && !isOwnProfile && !userReview;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const fetchReviews = useCallback(async () => {
    Promise.resolve().then(() => setLoadingReviews(true));
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(email)")
      .eq("freelancer_id", freelancer.id)
      .order("created_at", { ascending: false });

    const all = data || [];
    setReviews(all);
    if (user) {
      setUserReview(all.find(r => r.reviewer_id === user.id) || null);
    }
    setLoadingReviews(false);
  }, [freelancer.id, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) { toast.error("Please tap a star to rate"); return; }
    if (!comment.trim()) { toast.error("Please write a short review"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert([{
      freelancer_id: freelancer.id,
      reviewer_id: user.id,
      rating,
      comment: comment.trim(),
    }]);

    if (error) { toast.error("Failed to submit. Try again."); setSubmitting(false); return; }
    toast.success("Review submitted successfully");
    setRating(0);
    setComment("");
    setShowReviewForm(false);
    await fetchReviews();
    setSubmitting(false);
  }

  async function handleDeleteReview() {
    if (!userReview) return;
    await supabase.from("reviews").delete().eq("id", userReview.id);
    setUserReview(null);
    await fetchReviews();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition resize-none";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-bricolage font-bold text-lg text-slate-900">SkillFind</span>
            <span className="text-lg">🇳🇬</span>
          </button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5"
            >
              {copied
                ? <><Check size={14} /> Copied!</>
                : <><Share2 size={14} /> Share</>}
            </motion.button>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-slate-500 hover:text-slate-600 bg-transparent border-none cursor-pointer hidden sm:block"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">

          {/* ── LEFT COLUMN — Profile Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:sticky lg:top-24 flex flex-col gap-4"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-sm">

              {/* Avatar */}
              <div className="relative inline-block mx-auto mb-1">
                {freelancer.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={freelancer.avatar_url}
                    alt={freelancer.name}
                    className="w-40 h-40 rounded-3xl object-cover ring-4 ring-green-50 shadow-sm"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`w-40 h-40 rounded-3xl flex items-center justify-center font-bold text-4xl font-bricolage ring-4 ring-green-50 shadow-sm ${CATEGORY_COLORS[freelancer.category] || CATEGORY_COLORS.Other
                      }`}
                  >
                    {getInitials(freelancer.name)}
                  </div>
                )}
                {/* Availability dot */}
                <span className="absolute bottom-1 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full" title="Available for work" />
              </div>

              {/* Name, skill & availability */}
              <div className="w-full">
                <h1 className="font-bricolage text-2xl font-bold text-slate-900 mb-0">
                  {freelancer.name}
                </h1>
                <p className="text-sm font-semibold text-green-600 mb-1.5">
                  {freelancer.skill}
                </p>

                {/* Availability badge */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    <Zap size={10} className="fill-green-500 text-green-500" />
                    Available for work
                  </span>
                </div>

                {/* Category + Location */}
                <div className="flex items-center justify-center gap-4 mt-1">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor}`}>
                    {freelancer.category}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-red-400" />
                    {freelancer.state}
                  </span>
                </div>
              </div>

              {/* Rating summary */}
              {avgRating ? (
                <div className="w-full pt-3 border-t border-slate-100 flex flex-col items-center gap-1">
                  <StarRating rating={Math.round(Number(avgRating))} size={18} />
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{avgRating}</span> / 5
                    {" · "}{reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ) : (
                <div className="w-full pt-3 border-t border-slate-100 flex flex-col items-center gap-1">
                  <StarRating rating={0} size={16} />
                  <p className="text-xs text-slate-400">No reviews yet</p>
                </div>
              )}

              {/* Rate — prominent */}
              <div className="w-full mt-2 mb-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-green-600 font-semibold mb-0.5 uppercase tracking-wide">Rate</p>
                <p className="font-bricolage font-black text-green-800 text-3xl leading-tight">
                  {formatRate(freelancer.rate)}
                </p>
              </div>

              {/* Primary CTA */}
              <motion.a
                href={formatWhatsApp(freelancer.whatsapp)}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 w-full h-[54px] bg-green-600 hover:bg-green-700 text-white font-bold text-[15px] rounded-xl transition shadow-sm shadow-green-200"
              >
                <MessageCircle size={18} />
                Contact on WhatsApp
              </motion.a>

              {/* Secondary links */}
              <div className="w-full flex flex-col gap-2 mt-1">
                {freelancer.portfolio && (
                  <a
                    href={freelancer.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-[52px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[15px] rounded-xl transition"
                  >
                    <ExternalLink size={16} /> View Portfolio
                  </a>
                )}
                {freelancer.video_intro && (
                  <a
                    href={freelancer.video_intro}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-[52px] bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[15px] rounded-xl transition"
                  >
                    <Play size={16} /> Watch Intro Video
                  </a>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center justify-center gap-2 w-full h-[52px] border border-green-200 text-green-600 hover:bg-green-50 font-semibold text-[15px] rounded-xl transition cursor-pointer bg-transparent"
                  >
                    <Pencil size={16} /> Edit My Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <h2 className="font-bricolage font-bold text-slate-900 mb-3">About</h2>
              <BioText bio={freelancer.bio} />
            </motion.div>

            {/* Skills */}
            {freelancer.skill && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <h2 className="font-bricolage font-bold text-slate-900 mb-3">Core Skills</h2>
                <SkillChips skill={freelancer.skill} />
              </motion.div>
            )}

            {/* Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PortfolioSection
                freelancerId={freelancer.id}
                canEdit={isOwnProfile}
              />
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bricolage font-bold text-slate-900">
                  Reviews{" "}
                  {reviews.length > 0 && (
                    <span className="text-slate-500 font-normal text-sm">
                      ({reviews.length})
                    </span>
                  )}
                </h2>
                {canReview && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition bg-transparent border-none cursor-pointer"
                  >
                    {showReviewForm ? "Cancel" : "+ Review"}
                  </motion.button>
                )}
                {!user && (
                  <button
                    onClick={() => router.push("/auth")}
                    className="text-xs text-slate-500 hover:text-green-600 bg-transparent border-none cursor-pointer"
                  >
                    Sign in to review
                  </button>
                )}
              </div>

              {/* Review form */}
              <AnimatePresence>
                {showReviewForm && canReview && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmitReview}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 rounded-xl p-4 mb-5 flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-2">Tap to rate</p>
                        <StarRating rating={rating} onRate={setRating} readonly={false} size={22} />
                      </div>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                        placeholder="How was your experience working with this freelancer?"
                        className={inputClass}
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* User's own review */}
              {userReview && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Your Review</p>
                      <StarRating rating={userReview.rating} />
                    </div>
                    <button
                      onClick={handleDeleteReview}
                      className="text-xs text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{userReview.comment}</p>
                </div>
              )}

              {/* All reviews */}
              {loadingReviews ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse border border-slate-100 rounded-xl p-4">
                      <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
                      <div className="w-full h-3 bg-slate-200 rounded mb-1" />
                      <div className="w-3/4 h-3 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviews.filter(r => r.reviewer_id !== user?.id).length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Star className="text-slate-200 fill-transparent" size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">No reviews yet</p>
                  <p className="text-xs text-slate-400">
                    {user && !isOwnProfile
                      ? "Be the first to leave a review"
                      : "Reviews help freelancers get hired faster"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews
                    .filter(r => r.reviewer_id !== user?.id)
                    .map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Verified Client</p>
                            <StarRating rating={review.rating} />
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{review.comment}</p>
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>

      {/* Removed sticky WhatsApp button per layout balance feedback */}

    </div>
  );
}