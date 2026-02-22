"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFreelancer } from "@/utils/storage";
import { Freelancer } from "@/types";

const CATEGORIES = [
  "Technology", "Design", "Writing", "Marketing",
  "Trades", "Photography", "Education", "Other",
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function RegisterPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", skill: "", category: "", state: "",
    bio: "", rate: "", whatsapp: "", portfolio: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const newFreelancer: Freelancer = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    saveFreelancer(newFreelancer);
    setSubmitted(true);
    setTimeout(() => router.push("/"), 2000);
  }

  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <div className="success-screen">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2>Profile Created!</h2>
            <p>Taking you to the directory...</p>
            <div className="success-bar"><div className="success-bar-fill" /></div>
          </div>
        </div>
      </>
    );
  }

  const inputClass = (field: keyof typeof form) =>
    `sf-input ${errors[field] ? "sf-input--error" : ""}`;

  return (
    <>
      <style>{styles}</style>
      <div className="sf-page">
        {/* Left Panel */}
        <div className="sf-panel sf-panel--left">
          <div className="sf-brand">
            <span className="sf-logo">S</span>
            <span className="sf-logo-text">SkillFind</span>
          </div>
          <div className="sf-hero">
            <h1 className="sf-headline">
              Your skills.<br />
              <span className="sf-headline--accent">Nigeria's stage.</span>
            </h1>
            <p className="sf-subtext">
              Join thousands of professionals getting discovered by clients across Nigeria every day.
            </p>
          </div>
          <div className="sf-stats">
            <div className="sf-stat">
              <span className="sf-stat__num">2,400+</span>
              <span className="sf-stat__label">Freelancers</span>
            </div>
            <div className="sf-stat-divider" />
            <div className="sf-stat">
              <span className="sf-stat__num">36</span>
              <span className="sf-stat__label">States</span>
            </div>
            <div className="sf-stat-divider" />
            <div className="sf-stat">
              <span className="sf-stat__num">Free</span>
              <span className="sf-stat__label">Always</span>
            </div>
          </div>
          <div className="sf-flag">🇳🇬</div>
        </div>

        {/* Right Panel — Form */}
        <div className="sf-panel sf-panel--right">
          <div className="sf-form-wrap">
            <div className="sf-form-header">
              <h2>Create your profile</h2>
              <p>Takes less than 2 minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="sf-form" noValidate>
              {/* Row 1 */}
              <div className="sf-row">
                <div className="sf-field">
                  <label className="sf-label">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Chidi Okeke" className={inputClass("name")} />
                  {errors.name && <span className="sf-error">{errors.name}</span>}
                </div>
                <div className="sf-field">
                  <label className="sf-label">Skill Title</label>
                  <input name="skill" value={form.skill} onChange={handleChange}
                    placeholder="e.g. React Developer" className={inputClass("skill")} />
                  {errors.skill && <span className="sf-error">{errors.skill}</span>}
                </div>
              </div>

              {/* Row 2 */}
              <div className="sf-row">
                <div className="sf-field">
                  <label className="sf-label">Category</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className={inputClass("category")}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <span className="sf-error">{errors.category}</span>}
                </div>
                <div className="sf-field">
                  <label className="sf-label">State</label>
                  <select name="state" value={form.state} onChange={handleChange}
                    className={inputClass("state")}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className="sf-error">{errors.state}</span>}
                </div>
              </div>

              {/* Bio */}
              <div className="sf-field sf-field--full">
                <label className="sf-label">Professional Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                  placeholder="Describe your experience and what makes you unique..."
                  className={inputClass("bio")} />
                {errors.bio && <span className="sf-error">{errors.bio}</span>}
              </div>

              {/* Row 3 */}
              <div className="sf-row">
                <div className="sf-field">
                  <label className="sf-label">Rate (₦)</label>
                  <input name="rate" value={form.rate} onChange={handleChange}
                    placeholder="e.g. ₦5,000/hr" className={inputClass("rate")} />
                  {errors.rate && <span className="sf-error">{errors.rate}</span>}
                </div>
                <div className="sf-field">
                  <label className="sf-label">WhatsApp Number</label>
                  <input name="whatsapp" value={form.whatsapp} onChange={handleChange}
                    placeholder="e.g. 08012345678" className={inputClass("whatsapp")} />
                  {errors.whatsapp && <span className="sf-error">{errors.whatsapp}</span>}
                </div>
              </div>

              {/* Portfolio */}
              <div className="sf-field sf-field--full">
                <label className="sf-label">
                  Portfolio / Website <span className="sf-optional">(Optional)</span>
                </label>
                <input name="portfolio" value={form.portfolio} onChange={handleChange}
                  placeholder="https://yourportfolio.com" className="sf-input" />
              </div>

              <button type="submit" className="sf-submit">
                Create Profile & Join SkillFind →
              </button>

              <p className="sf-terms">
                By joining, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sf-page {
    display: flex;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #f5f5f0;
  }

  /* ── LEFT PANEL ── */
  .sf-panel--left {
    width: 420px;
    min-width: 420px;
    background: #0a3d1f;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }

  .sf-panel--left::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .sf-panel--left::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .sf-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .sf-logo {
    width: 36px; height: 36px;
    background: #22c55e;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 18px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }

  .sf-logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 20px;
    color: #fff;
    letter-spacing: -0.3px;
  }

  .sf-hero {
    position: relative;
    z-index: 1;
  }

  .sf-headline {
    font-family: 'Syne', sans-serif;
    font-size: 42px;
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -1px;
    margin-bottom: 20px;
  }

  .sf-headline--accent {
    color: #4ade80;
  }

  .sf-subtext {
    font-size: 15px;
    color: rgba(255,255,255,0.6);
    line-height: 1.6;
    max-width: 300px;
  }

  .sf-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 1;
  }

  .sf-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sf-stat__num {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
  }

  .sf-stat__label {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sf-stat-divider {
    width: 1px; height: 32px;
    background: rgba(255,255,255,0.15);
  }

  .sf-flag {
    font-size: 28px;
    position: relative;
    z-index: 1;
  }

  /* ── RIGHT PANEL ── */
  .sf-panel--right {
    flex: 1;
    overflow-y: auto;
    padding: 48px 40px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .sf-form-wrap {
    width: 100%;
    max-width: 600px;
  }

  .sf-form-header {
    margin-bottom: 32px;
  }

  .sf-form-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .sf-form-header p {
    font-size: 14px;
    color: #94a3b8;
  }

  .sf-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sf-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .sf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sf-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    letter-spacing: 0.1px;
  }

  .sf-optional {
    font-weight: 400;
    color: #9ca3af;
  }

  .sf-input {
    width: 100%;
    padding: 11px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    resize: none;
    appearance: none;
  }

  .sf-input::placeholder { color: #c0c9d8; }

  .sf-input:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
  }

  .sf-input--error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
  }

  .sf-error {
    font-size: 12px;
    color: #ef4444;
    font-weight: 500;
  }

  .sf-submit {
    margin-top: 8px;
    width: 100%;
    padding: 14px;
    background: #16a34a;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    letter-spacing: 0.2px;
  }

  .sf-submit:hover {
    background: #15803d;
    box-shadow: 0 4px 20px rgba(22,163,74,0.35);
    transform: translateY(-1px);
  }

  .sf-submit:active { transform: translateY(0); }

  .sf-terms {
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
  }

  /* ── SUCCESS ── */
  .success-screen {
    min-height: 100vh;
    background: #f5f5f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-card {
    background: #fff;
    border-radius: 20px;
    padding: 52px 48px;
    text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    max-width: 380px;
    width: 90%;
  }

  .success-icon {
    width: 64px; height: 64px;
    background: #dcfce7;
    color: #16a34a;
    font-size: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }

  .success-card h2 {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .success-card p {
    color: #94a3b8;
    font-size: 14px;
    margin-bottom: 28px;
  }

  .success-bar {
    height: 4px;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
  }

  .success-bar-fill {
    height: 100%;
    background: #22c55e;
    border-radius: 99px;
    animation: fillBar 2s linear forwards;
  }

  @keyframes fillBar {
    from { width: 0% }
    to { width: 100% }
  }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .sf-page { flex-direction: column; }

    .sf-panel--left {
      width: 100%;
      min-width: unset;
      height: auto;
      position: static;
      padding: 36px 24px;
      flex-direction: column;
      gap: 28px;
    }

    .sf-headline { font-size: 32px; }

    .sf-panel--right {
      padding: 32px 20px 48px;
    }

    .sf-row {
      grid-template-columns: 1fr;
    }

    .sf-form-wrap {
      max-width: 100%;
    }
  }
`;
