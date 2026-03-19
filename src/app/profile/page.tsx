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

const CATEGORIES = ["Technology","Design","Writing","Marketing","Trades","Photography","Education","Other"];
const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition appearance-none resize-none";

const AVATAR_COLORS: Record<string, string> = {
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
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", skill: "", category: "", state: "",
    bio: "", rate: "", whatsapp: "", portfolio: "",
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
          category: profile.category, state: profile.state,
          bio: profile.bio, rate: profile.rate,
          whatsapp: profile.whatsapp, portfolio: profile.portfolio || "",
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
      setServerError("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setServerError("Image must be smaller than 2MB");
      return;
    }

    // Show preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setUploadingPhoto(true);
    setServerError("");

    const url = await uploadAvatar(user.id, file);

    if (!url) {
      setServerError("Failed to upload photo. Please try again.");
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
    setServerError("");

    const { error } = await supabase
      .from("freelancers")
      .update({ ...form })
      .eq("id", freelancer.id);

    if (error) {
      setServerError("Failed to save changes. Please try again.");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleDelete() {
    if (!freelancer) return;
    setDeleting(true);
    const { error } = await deleteFreelancer(freelancer.id);
    if (error) {
      setServerError("Failed to delete profile. Please try again.");
      setDeleting(false);
      return;
    }
    router.push("/");
  }

  const displayPhoto = previewUrl || avatarUrl;
  const avatarColor = AVATAR_COLORS[form.category] || AVATAR_COLORS.Other;

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading your profile...</p>
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
            <p className="text-sm text-slate-400">Changes are saved to your public listing instantly</p>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 font-medium bg-transparent border-none cursor-pointer">
            Delete Profile
          </button>
        </div>

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            ✓ Profile updated successfully!
          </div>
        )}
        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {serverError}
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
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl ${avatarColor}`}>
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
            <p className="text-xs text-slate-400 mb-3">JPG, PNG or WebP · Max 2MB · Square works best</p>
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
              <input name="skill" value={form.skill} onChange={handleChange} className={inputClass} required />
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
              <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <AIPriceSuggester
                skill={form.skill}
                category={form.category}
                state={form.state}
                onApply={(rate) => setForm({ ...form, rate })}
              />
              <input
                name="rate"
                value={form.rate}
                onChange={handleChange}
                placeholder="e.g. ₦5,000/hr or ₦50,000/project"
                className={inputClass}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Portfolio / Website <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" className={inputClass} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none">
              {saving ? "Saving..." : "Save Changes →"}
            </button>
            <button type="button" onClick={() => router.push("/")}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer border-none">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete your profile?</h2>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently remove your listing. Clients will no longer be able to find you. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer border-none">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}