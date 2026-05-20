"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, MessageCircle, ExternalLink, Play, Pencil, Check, Share2 } from "lucide-react";
import { Freelancer } from "@/types";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

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
}: {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
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
          className={`transition border-none bg-transparent ${
            readonly ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <Star
            size={18}
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
  const isLong = bio.length > 200;
  return (
    <div>
      <p className="text-sm text-slate-600 leading-relaxed">
        {isLong && !expanded ? bio.slice(0, 200) + "..." : bio}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-green-600 font-medium mt-1 bg-transparent border-none cursor-pointer hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
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

  const badgeColor =
    CATEGORY_COLORS[freelancer.category] || CATEGORY_COLORS.Other;
  const isOwnProfile = user?.id === freelancer.user_id;
  const canReview = user && !isOwnProfile && !userReview;

  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      ).toFixed(1)
    : null;

  useEffect(() => {
    fetchReviews();
  }, [freelancer.id]);

  async function fetchReviews() {
    setLoadingReviews(true);
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
  }

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
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-bricolage font-bold text-lg text-slate-900">
              SkillFind
            </span>
            <span className="text-lg">🇳🇬</span>
          </button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition cursor-pointer border-none"
            >
              {copied ? <><Check size={14} className="inline -mt-0.5" /> Copied!</> : <><Share2 size={14} className="inline -mt-0.5" /> Share</>}
            </motion.button>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer hidden sm:block"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-4"
            >
              {/* Avatar */}
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl font-bricolage ${
                    CATEGORY_COLORS[freelancer.category] || CATEGORY_COLORS.Other
                  }`}
                >
                  {getInitials(freelancer.name)}
                </div>
              )}

              {/* Name & Skill */}
              <div>
                <h1 className="font-bricolage text-xl font-bold text-slate-900 mb-1">
                  {freelancer.name}
                </h1>
                <p className="text-sm font-medium text-green-600 mb-3">
                  {freelancer.skill}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeColor}`}>
                    {freelancer.category}
                  </span>
                  <span className="text-xs text-slate-400">📍 {freelancer.state}</span>
                </div>
              </div>

              {/* Rating summary */}
              {avgRating && (
                <div className="flex flex-col items-center gap-1">
                  <StarRating rating={Math.round(Number(avgRating))} />
                  <p className="text-xs text-slate-400">
                    {avgRating} / 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {/* Rate */}
              <div className="w-full pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Rate</p>
                <p className="font-bricolage font-bold text-slate-900 text-lg">
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
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition"
              >
                <MessageCircle size={16} /> Contact on WhatsApp
              </motion.a>

              {/* Secondary links */}
              <div className="w-full flex flex-col gap-2">
                {freelancer.portfolio && (
                  <a
                    href={freelancer.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition"
                  >
                    <ExternalLink size={14} /> View Portfolio
                  </a>
                )}
                {freelancer.video_intro && (
                  <a
                    href={freelancer.video_intro}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded-xl transition"
                  >
                    <Play size={14} /> Watch Intro Video
                  </a>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-green-200 text-green-600 hover:bg-green-50 font-medium text-sm rounded-xl transition cursor-pointer bg-transparent"
                  >
                    <Pencil size={14} /> Edit My Profile
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <h2 className="font-bricolage font-bold text-slate-900 mb-3">About</h2>
              <BioText bio={freelancer.bio} />
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bricolage font-bold text-slate-900">
                  Reviews{" "}
                  {reviews.length > 0 && (
                    <span className="text-slate-400 font-normal text-sm">
                      ({reviews.length})
                    </span>
                  )}
                </h2>
                {canReview && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer"
                  >
                    {showReviewForm ? "Cancel" : "+ Review"}
                  </button>
                )}
                {!user && (
                  <button
                    onClick={() => router.push("/auth")}
                    className="text-xs text-slate-400 hover:text-green-600 bg-transparent border-none cursor-pointer"
                  >
                    Sign in to review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && canReview && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  onSubmit={handleSubmitReview}
                  className="bg-slate-50 rounded-xl p-4 mb-5 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      Tap to rate
                    </p>
                    <StarRating rating={rating} onRate={setRating} readonly={false} />
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
                </motion.form>
              )}

              {/* User's own review */}
              {userReview && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Your Review
                      </p>
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
                    <div
                      key={i}
                      className="animate-pulse border border-slate-100 rounded-xl p-4"
                    >
                      <div className="w-24 h-3 bg-slate-200 rounded mb-2" />
                      <div className="w-full h-3 bg-slate-200 rounded mb-1" />
                      <div className="w-3/4 h-3 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviews.filter(r => r.reviewer_id !== user?.id).length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center justify-center">
                  <Star className="text-slate-300 fill-transparent mb-2" size={32} />
                  <p className="text-sm text-slate-400">
                    No reviews yet — be the first!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews
                    .filter(r => r.reviewer_id !== user?.id)
                    .map(review => (
                      <div
                        key={review.id}
                        className="border border-slate-100 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">
                              Verified User
                            </p>
                            <StarRating rating={review.rating} />
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "en-NG",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky WhatsApp button on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-40">
        <motion.a
          href={formatWhatsApp(freelancer.whatsapp)}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl"
        >
          <MessageCircle size={16} /> Contact {freelancer.name.split(" ")[0]} on WhatsApp
        </motion.a>
      </div>

    </div>
  );
}