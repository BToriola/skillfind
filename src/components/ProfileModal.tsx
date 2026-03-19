"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { Freelancer } from "@/types";
import { getCategoryColor, getInitials, formatWhatsApp, formatRate } from "@/utils/helpers";
import StarRating from "@/components/StarRating";
import { motion, AnimatePresence } from "framer-motion";

type Review = {
  id: string;
  freelancer_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { email: string };
};

interface ProfileModalProps {
  freelancer: Freelancer;
  onClose: () => void;
}

export default function ProfileModal({ freelancer, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { bg, text } = getCategoryColor(freelancer.category);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => { fetchReviews(); }, [freelancer.id]);

  async function fetchReviews() {
    setLoadingReviews(true);
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(email)")
      .eq("freelancer_id", freelancer.id)
      .order("created_at", { ascending: false });

    const allReviews = data || [];
    setReviews(allReviews);
    if (user) {
      const mine = allReviews.find(r => r.reviewer_id === user.id);
      setUserReview(mine || null);
    }
    setLoadingReviews(false);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) { setReviewError("Please select a star rating"); return; }
    if (!comment.trim()) { setReviewError("Please write a comment"); return; }
    if (user.id === freelancer.user_id) { setReviewError("You cannot review your own profile"); return; }

    setSubmitting(true);
    setReviewError("");
    const { error } = await supabase.from("reviews").insert([{
      freelancer_id: freelancer.id,
      reviewer_id: user.id,
      rating,
      comment: comment.trim(),
    }]);

    if (error) { setReviewError(error.message); setSubmitting(false); return; }
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

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const isOwnProfile = user?.id === freelancer.user_id;
  const canReview = user && !isOwnProfile && !userReview;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal Card */}
        <motion.div
          className="bg-white rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto z-10"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={e => e.stopPropagation()}
        >

        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-xs cursor-pointer transition border-none">✕</button>
          <div className="flex gap-4 items-start">
            {freelancer.avatar_url ? (
              <Image src={freelancer.avatar_url} alt={freelancer.name} width={56} height={56} className="w-14 h-14 min-w-14 rounded-2xl object-cover" />
            ) : (
              <div className={`w-14 h-14 min-w-[56px] rounded-2xl flex items-center justify-center font-bold text-xl ${bg} ${text}`}>
                {getInitials(freelancer.name)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-[family-name:var(--font-bricolage)] text-xl font-bold text-slate-900">{freelancer.name}</h2>
              <p className="text-sm font-medium text-green-600 mb-2">{freelancer.skill}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${bg} ${text}`}>{freelancer.category}</span>
                <span className="text-xs text-slate-400">📍 {freelancer.state}</span>
                {avgRating && <span className="text-xs font-semibold text-yellow-500">★ {avgRating} ({reviews.length})</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col gap-5">
          {/* Bio */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">About</p>
            <p className="text-sm text-slate-600 leading-relaxed">{freelancer.bio}</p>
          </div>

          {/* Info row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Rate</p>
              <p className="text-sm font-bold text-slate-900">{formatRate(freelancer.rate)}</p>
            </div>
            {freelancer.portfolio && (
              <div className="flex-1 bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Portfolio</p>
                <a href={freelancer.portfolio} target="_blank" rel="noreferrer" className="text-sm font-medium text-green-600 hover:underline">View work →</a>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <motion.a href={formatWhatsApp(freelancer.whatsapp)} target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition">
            💬 Contact on WhatsApp
          </motion.a>

          {/* Reviews */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-slate-900">
                Reviews {reviews.length > 0 && <span className="font-[family-name:var(--font-dm)] text-slate-400 font-normal text-sm">({reviews.length})</span>}
              </h3>
              {canReview && (
                <button onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm font-semibold text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer">
                  {showReviewForm ? "Cancel" : "+ Write a Review"}
                </button>
              )}
              {!user && (
                <button onClick={() => { onClose(); router.push("/auth"); }}
                  className="text-sm font-semibold text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer">
                  Sign in to Review
                </button>
              )}
            </div>

            {showReviewForm && canReview && (
              <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-xl p-4 mb-4 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Your Rating</p>
                  <StarRating rating={rating} onRate={setRating} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Your Review</p>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder="Share your experience working with this freelancer..."
                    className="w-full px-3 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition resize-none" />
                </div>
                {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none">
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {userReview && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Your Review</p>
                    <StarRating rating={userReview.rating} readonly />
                  </div>
                  <button onClick={handleDeleteReview} className="text-xs text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer">Delete</button>
                </div>
                <p className="text-sm text-slate-600">{userReview.comment}</p>
              </div>
            )}

            {loadingReviews ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading reviews...</p>
            ) : reviews.filter(r => r.reviewer_id !== user?.id).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {reviews.length === 0 ? "No reviews yet. Be the first!" : ""}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.filter(r => r.reviewer_id !== user?.id).map(review => (
                  <div key={review.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {review.profiles?.email?.split("@")[0] || "User"}
                        </p>
                        <StarRating rating={review.rating} readonly />
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(review.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
