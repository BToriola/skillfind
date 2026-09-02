"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserFreelancerProfile, deleteFreelancer, uploadAvatar } from "@/utils/storage";
import { supabase } from "@/utils/supabase";
import { Freelancer } from "@/types";
import Image from "next/image";
import AIBioGenerator from "@/components/AIBioGenerator";
import AIPriceSuggester from "@/components/AIPriceSuggester";
import PortfolioSection from "@/components/PortfolioSection";
import PricingFields from "@/components/PricingFields";
import VerificationSection from "@/components/VerificationSection";
import { AlertTriangle, Loader2, Link2, Copy, Check, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getInitials, getCategoryColor, toPricingPayload } from "@/utils/helpers";

import { CATEGORIES, NIGERIAN_STATES } from "@/constants";

const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition appearance-none resize-none";





export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", skill: "", category: "", state: "", city: "",
    bio: "", rate_type: "", rate_min: "", rate_max: "", whatsapp: "", portfolio: "",
    video_intro: "",
  });

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserFreelancerProfile(user.id).then(profile => {
        if (!profile) { router.push("/register"); return; }
        setFreelancer(profile);
        setAvatarUrl(profile.avatar_url);
        setForm({
          name: profile.name, skill: profile.skill,
          category: profile.category, state: profile.state, city: profile.city || "",
          bio: profile.bio,
          rate_type: profile.rate_type || "",
          rate_min: profile.rate_min != null ? String(profile.rate_min) : "",
          rate_max: profile.rate_max != null ? String(profile.rate_max) : "",
          whatsapp: profile.whatsapp, portfolio: profile.portfolio || "",
          video_intro: profile.video_intro || "",
        });
        setLoadingProfile(false);
      });
    }
  }, [user, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !freelancer) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    // Show preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setUploadingPhoto(true);

    const url = await uploadAvatar(user.id, file);

    if (!url) {
      toast.error("Failed to upload photo. Please try again.");
      setPreviewUrl(null);
      setUploadingPhoto(false);
      return;
    }

    // Save avatar_url to freelancer record
    await supabase
      .from("freelancers")
      .update({ avatar_url: url })
      .eq("id", freelancer.id);

    setAvatarUrl(url);
    setUploadingPhoto(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!freelancer) return;
    setSaving(true);

    const { rate_type, rate_min, rate_max, ...rest } = form;
    const { error } = await supabase
      .from("freelancers")
      .update({ ...rest, ...toPricingPayload({ rate_type, rate_min, rate_max }) })
      .eq("id", freelancer.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes. Please try again.");
      return;
    }

    toast.success("Profile updated successfully!");
  }

  async function handleDelete() {
    if (!freelancer) return;
    setDeleting(true);
    const { error } = await deleteFreelancer(freelancer.id);
    if (error) {
      toast.error("Failed to delete profile. Please try again.");
      setDeleting(false);
      return;
    }
    router.push("/");
  }

  const displayPhoto = previewUrl || avatarUrl;
  const avatarColor = getCategoryColor(form.category);
  const avatarClass = `${avatarColor.bg} ${avatarColor.text}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (typeof window !== "undefined" ? window.location.origin : "");
  const profileUrl = freelancer?.slug ? `${siteUrl}/freelancer/${freelancer.slug}` : "";
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `I'm ${form.name || "on"} SkillFind — ${form.skill || "check out my profile"}. See my work and contact me here: ${profileUrl}`
  )}`;

  function handleCopyProfileLink() {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer bg-transparent border-none">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-lg text-slate-900">SkillFind</span>
            <span className="text-lg">🇳🇬</span>
          </button>
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer">
            ← Back to Directory
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Edit Your Profile</h1>
            <p className="text-sm text-slate-500">Changes are saved to your public listing instantly</p>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 font-medium bg-transparent border-none cursor-pointer">
            Delete Profile
          </button>
        </div>

        {/* Share link — this is the actual pitch: a page you can send a
            client instead of the Share button, which only ever lived on
            the public-facing view visitors see, never here. */}
        {profileUrl && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 sm:p-6 mb-6">
            <p className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1.5">
              <Link2 size={16} /> Your public profile link
            </p>
            <p className="text-xs text-green-700 mb-3">
              Send this to any client — no app to download, they see your work instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 bg-white border border-green-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 truncate">
                {profileUrl}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyProfileLink}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-green-200 hover:border-green-300 text-green-700 font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                  {linkCopied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                </button>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition"
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative">
            {displayPhoto ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200">
                <Image
                  src={displayPhoto} alt="Profile photo"
                  width={80} height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl ${avatarClass}`}>
                {getInitials(form.name || "?")}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Profile Photo</p>
            <p className="text-xs text-slate-500 mb-3">JPG, PNG or WebP · Max 2MB · Square works best</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer border-none"
              >
                {uploadingPhoto ? "Uploading..." : displayPhoto ? "Change Photo" : "Upload Photo"}
              </button>
              {displayPhoto && !uploadingPhoto && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!freelancer) return;
                    await supabase.from("freelancers").update({ avatar_url: null }).eq("id", freelancer.id);
                    setAvatarUrl(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-2 text-red-400 hover:text-red-600 font-medium text-xs rounded-lg transition cursor-pointer bg-transparent border-none"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Skill Title</label>
              <input
                name="skill"
                value={form.skill}
                onChange={handleChange}
                maxLength={60}
                placeholder="e.g. Graphic Designer"
                className={inputClass}
                required
              />
              <p className="text-xs text-slate-400">One short title — save the details for your bio below</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">State</label>
              {/* A blank placeholder option is required for the `required`
                  attribute below to mean anything — without one, a <select>
                  is always considered "filled" (defaulting to the first
                  option), even for a legacy profile with no state set. */}
              <select name="state" value={form.state} onChange={handleChange} className={inputClass} required>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">City / Area</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Bodija, Ibadan"
              className={inputClass}
              required
            />
            <p className="text-xs text-slate-400">Helps clients nearby find and choose you first</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <AIBioGenerator
              name={form.name}
              skill={form.skill}
              state={form.state}
              onGenerated={(bio) => setForm({ ...form, bio })}
            />
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <AIPriceSuggester
              skill={form.skill}
              category={form.category}
              state={form.state}
              onApply={(pricing) => setForm({ ...form, ...pricing })}
            />
            <PricingFields
              value={{ rate_type: form.rate_type, rate_min: form.rate_min, rate_max: form.rate_max }}
              onChange={(next) => setForm({ ...form, ...next })}
              inputClass={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Portfolio / Website <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Video Introduction <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              name="video_intro"
              value={form.video_intro || ""}
              onChange={handleChange}
              placeholder="YouTube or Loom URL e.g. https://youtu.be/xxxxx"
              className={inputClass}
            />
            <p className="text-xs text-slate-500">
              A short intro video builds 3x more trust with clients
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Loader2 size={16} />
                  </motion.span>
                  Saving...
                </span>
              ) : "Save Changes →"}
            </button>
            <button type="button" onClick={() => router.push("/")}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer border-none">
              Cancel
            </button>
          </div>
        </form>

        {/* Verification */}
        {freelancer && user && (
          <div className="mt-6">
            <VerificationSection
              freelancerId={freelancer.id}
              userId={user.id}
              isVerified={!!freelancer.is_verified}
            />
          </div>
        )}

        {/* Portfolio Section */}
        {freelancer && (
          <div className="mt-6">
            <PortfolioSection
              freelancerId={freelancer.id}
              canEdit={true}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal — same entrance/exit pattern as ProfileModal
          elsewhere in the app, which this dialog previously didn't match. */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl flex flex-col items-center relative z-10"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AlertTriangle className="text-red-500 mb-4" size={40} />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Delete your profile?</h2>
              <p className="text-sm text-slate-500 mb-6">
                This will permanently remove your listing. Clients will no longer be able to find you. This cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer border-none">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none">
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}