"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { saveFreelancer, getUserFreelancerProfile } from "@/utils/storage";
import { CheckCircle, ArrowRight, User, ArrowLeft } from "lucide-react";
import AIBioGenerator from "@/components/AIBioGenerator";
import AIPriceSuggester from "@/components/AIPriceSuggester";

const CATEGORIES = ["Technology", "Design", "Writing", "Marketing", "Trades", "Photography", "Education", "Other"];
const NIGERIAN_STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition appearance-none resize-none";
const inputError = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-red-400 rounded-xl outline-none placeholder:text-gray-300 transition appearance-none resize-none";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyListed, setAlreadyListed] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({
    name: "", skill: "", category: "", state: "",
    bio: "", rate: "", whatsapp: "", portfolio: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Check if user already has a profile
  useEffect(() => {
    if (user) {
      getUserFreelancerProfile(user.id).then(profile => {
        if (profile) setAlreadyListed(true);
        setCheckingProfile(false);
      });
    }
  }, [user]);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.skill.trim()) e.skill = "Required";
    if (!form.category) e.category = "Required";
    if (!form.state) e.state = "Required";
    if (!form.bio.trim()) e.bio = "Required";
    if (!form.rate.trim()) e.rate = "Required";
    if (!form.whatsapp.trim()) e.whatsapp = "Required";
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
    setServerError("");

    const result = await saveFreelancer({ ...form, user_id: user.id });

    if (!result) {
      setServerError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    setSubmitted(true);
    setTimeout(() => router.push("/"), 2000);
  }

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (alreadyListed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">You're already listed!</h2>
          <p className="text-sm text-slate-400 mb-6">You already have a profile on SkillFind.</p>
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
          <p className="text-sm text-slate-400">Taking you to the directory...</p>
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
            <span className="text-green-400">Nigeria's stage.</span>
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
            <p className="text-sm text-slate-400">Takes less than 2 minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Chidi Okeke" className={errors.name ? inputError : inputClass} />
                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Skill Title</label>
                <input name="skill" value={form.skill} onChange={handleChange} placeholder="e.g. React Developer" className={errors.skill ? inputError : inputClass} />
                {errors.skill && <span className="text-xs text-red-500">{errors.skill}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={errors.category ? inputError : inputClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">State</label>
                <select name="state" value={form.state} onChange={handleChange} className={errors.state ? inputError : inputClass}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="text-xs text-red-500">{errors.state}</span>}
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
                rows={3}
                placeholder="Describe your experience and what makes you unique..."
                className={errors.bio ? inputError : inputClass}
              />
              {errors.bio && <span className="text-xs text-red-500">{errors.bio}</span>}
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
                  className={errors.rate ? inputError : inputClass}
                />
                {errors.rate && <span className="text-xs text-red-500">{errors.rate}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="e.g. 08012345678" className={errors.whatsapp ? inputError : inputClass} />
                {errors.whatsapp && <span className="text-xs text-red-500">{errors.whatsapp}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Portfolio / Website <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" className={inputClass} />
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="mt-2 w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
              {saving ? "Saving..." : <span className="flex items-center gap-2">Create Profile & Join SkillFind <ArrowRight size={18} /></span>}
            </button>

            <p className="text-center text-xs text-slate-400">
              By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}