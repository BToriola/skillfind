"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { saveFreelancer, getUserFreelancerProfile } from "@/utils/storage";
import { supabase } from "@/utils/supabase";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AIBioGenerator from "@/components/AIBioGenerator";
import AIPriceSuggester from "@/components/AIPriceSuggester";
import PricingFields from "@/components/PricingFields";

import { CATEGORIES, NIGERIAN_STATES } from "@/constants";
import { parseNairaAmount, toPricingPayload } from "@/utils/helpers";

const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition appearance-none resize-none";
const inputError = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-red-400 rounded-xl outline-none placeholder:text-gray-300 transition appearance-none resize-none";

// Slides the message in/out rather than having it pop the layout instantly —
// used under every validated field below.
function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.span
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs text-red-500 overflow-hidden block"
        >
          {message}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyListed, setAlreadyListed] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [form, setForm] = useState({
    name: "", skill: "", category: "", state: "", city: "",
    bio: "", rate_type: "", rate_min: "", rate_max: "", whatsapp: "", portfolio: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Check if user already has a profile
  useEffect(() => {
    if (user) {
      // Check if already listed
      getUserFreelancerProfile(user.id).then(profile => {
        if (profile) { setAlreadyListed(true); setCheckingProfile(false); return; }
        setCheckingProfile(false);
      });

      // Prefill name from profile
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setForm(prev => ({ ...prev, name: data.full_name }));
          }
        });
    }
  }, [user]);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.skill.trim()) e.skill = "Required";
    if (!form.category) e.category = "Required";
    if (!form.state) e.state = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.whatsapp.trim()) e.whatsapp = "Required";
    // A priced type with no amount would be rejected by the DB's
    // freelancers_rate_coherent check, so catch it here with a real message.
    if (form.rate_type && form.rate_type !== "negotiable") {
      const min = parseNairaAmount(form.rate_min);
      const max = parseNairaAmount(form.rate_max);
      if (min == null) e.rate_min = "Enter an amount, or choose Negotiable";
      else if (max != null && max <= min) e.rate_min = "\u201cTo\u201d must be higher than \u201cFrom\u201d";
    }
    return e;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!user) return;

    setSaving(true);

    const { rate_type, rate_min, rate_max, ...rest } = form;
    const result = await saveFreelancer({
      ...rest,
      ...toPricingPayload({ rate_type, rate_min, rate_max }),
      user_id: user.id,
    });

    if (!result) {
      toast.error("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    setSubmitted(true);
    setTimeout(() => router.push("/"), 2000);
  }

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (alreadyListed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">You&apos;re already listed!</h2>
          <p className="text-sm text-slate-500 mb-6">You already have a profile on SkillFind.</p>
          <button onClick={() => router.push("/")}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
            View Directory <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Created!</h2>
          <p className="text-sm text-slate-500">Taking you to the directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">

      {/* Left Panel */}
      <div className="lg:w-96 lg:min-w-96 bg-green-950 px-10 py-12 flex flex-col justify-between lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
          <span className="text-white font-bold text-xl">SkillFind</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your skills.<br />
            <span className="text-green-400">Nigeria&apos;s stage.</span>
          </h1>
          <p className="text-green-200/60 text-sm leading-relaxed">
            Join thousands of professionals getting discovered by clients across Nigeria every day.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-white font-bold text-xl">2,400+</p>
            <p className="text-green-200/50 text-xs uppercase tracking-wide">Freelancers</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-white font-bold text-xl">36</p>
            <p className="text-green-200/50 text-xs uppercase tracking-wide">States</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-white font-bold text-xl">Free</p>
            <p className="text-green-200/50 text-xs uppercase tracking-wide">Always</p>
          </div>
        </div>
        <span className="text-3xl">🇳🇬</span>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex justify-center">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your profile</h2>
            <p className="text-sm text-slate-500">Takes less than 2 minutes</p>
          </div>

          {isWelcome && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-2 flex gap-3 items-start">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-sm font-semibold text-green-800 mb-0.5">
                  You&apos;re 1 step away from getting discovered!
                </p>
                <p className="text-sm text-green-700">
                  Fill in your details below — it takes about 2 minutes. Once done, clients across Nigeria can find and contact you instantly.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Chidi Okeke" className={errors.name ? inputError : inputClass} />
                <FieldError message={errors.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Skill Title</label>
                <input
                  name="skill"
                  value={form.skill}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder="e.g. Graphic Designer"
                  className={errors.skill ? inputError : inputClass}
                />
                <p className="text-xs text-slate-400">One short title — save the details for your bio below</p>
                <FieldError message={errors.skill} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={errors.category ? inputError : inputClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <FieldError message={errors.category} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">State</label>
                <select name="state" value={form.state} onChange={handleChange} className={errors.state ? inputError : inputClass}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError message={errors.state} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">City / Area</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Bodija, Ibadan"
                className={errors.city ? inputError : inputClass}
              />
              <p className="text-xs text-slate-400">Helps clients nearby find and choose you first</p>
              <FieldError message={errors.city} />
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
                rows={3}
                placeholder="Describe your experience and what makes you unique..."
                className={errors.bio ? inputError : inputClass}
              />
              <FieldError message={errors.bio} />
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
                error={errors.rate_min}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="e.g. 08012345678" className={errors.whatsapp ? inputError : inputClass} />
              <FieldError message={errors.whatsapp} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Portfolio / Website <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" className={inputClass} />
            </div>



            <button type="submit" disabled={saving}
              className="mt-2 w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
              {saving ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Loader2 size={16} />
                  </motion.span>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Profile & Join SkillFind <ArrowRight size={18} /></span>
              )}
            </button>

            <p className="text-center text-xs text-slate-500">
              By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}