"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFreelancers } from "@/utils/storage";
import { Freelancer } from "@/types";

const CATEGORIES = [
  "All", "Technology", "Design", "Writing", "Marketing",
  "Trades", "Photography", "Education", "Other",
];

const NIGERIAN_STATES = [
  "All States", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

// ── Seed data so directory is never empty ──
const SEED_FREELANCERS: Freelancer[] = [
  { id: "seed-1", name: "Amara Okafor", skill: "React Developer", category: "Technology", state: "Lagos", bio: "5 years building fast, scalable web apps with React and Next.js. Former engineer at a Lagos fintech.", rate: "₦15,000/hr", whatsapp: "08011111111", portfolio: "https://amaradev.com", createdAt: "" },
  { id: "seed-2", name: "Tunde Adeyemi", skill: "Logo & Brand Designer", category: "Design", state: "Oyo", bio: "I help startups and small businesses build memorable brand identities. 200+ clients served.", rate: "₦80,000/project", whatsapp: "08022222222", portfolio: "", createdAt: "" },
  { id: "seed-3", name: "Ngozi Eze", skill: "Copywriter & Content Strategist", category: "Writing", state: "Enugu", bio: "SEO-focused content writer for SaaS, fintech, and e-commerce brands. Fast turnaround.", rate: "₦5,000/article", whatsapp: "08033333333", portfolio: "https://ngoziwrites.com", createdAt: "" },
  { id: "seed-4", name: "Emeka Nwosu", skill: "Electrician & Solar Installer", category: "Trades", state: "Anambra", bio: "Certified electrician with 8 years experience. Residential wiring, solar panels, inverter setup.", rate: "₦10,000/day", whatsapp: "08044444444", portfolio: "", createdAt: "" },
  { id: "seed-5", name: "Fatima Bello", skill: "Social Media Manager", category: "Marketing", state: "Kano", bio: "I grow brand presence on Instagram, TikTok and Twitter. Managed accounts with 100k+ followers.", rate: "₦50,000/month", whatsapp: "08055555555", portfolio: "", createdAt: "" },
  { id: "seed-6", name: "Chukwudi Obi", skill: "Wedding & Event Photographer", category: "Photography", state: "Rivers", bio: "Professional photographer covering weddings, corporate events and portraits across the south-south.", rate: "₦120,000/event", whatsapp: "08066666666", portfolio: "https://chuks.photos", createdAt: "" },
];

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    Technology: "#dbeafe|#1d4ed8",
    Design: "#fce7f3|#be185d",
    Writing: "#fef9c3|#a16207",
    Marketing: "#ffedd5|#c2410c",
    Trades: "#dcfce7|#15803d",
    Photography: "#f3e8ff|#7e22ce",
    Education: "#cffafe|#0e7490",
    Other: "#f1f5f9|#475569",
  };
  const val = map[category] || map["Other"];
  const [bg, text] = val.split("|");
  return { bg, text };
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatWhatsApp(number: string) {
  const cleaned = number.replace(/\D/g, "");
  const international = cleaned.startsWith("0") ? "234" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${international}`;
}

// ── Profile Modal ──
function ProfileModal({ freelancer, onClose }: { freelancer: Freelancer; onClose: () => void }) {
  const colors = getCategoryColor(freelancer.category);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <style>{modalStyles}</style>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>

          <div className="modal-header">
            <div className="modal-avatar" style={{ background: colors.bg, color: colors.text }}>
              {getInitials(freelancer.name)}
            </div>
            <div>
              <h2 className="modal-name">{freelancer.name}</h2>
              <p className="modal-skill">{freelancer.skill}</p>
              <div className="modal-meta">
                <span className="modal-badge" style={{ background: colors.bg, color: colors.text }}>
                  {freelancer.category}
                </span>
                <span className="modal-location">📍 {freelancer.state}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <p className="modal-section-label">About</p>
            <p className="modal-bio">{freelancer.bio}</p>
          </div>

          <div className="modal-row">
            <div className="modal-info-box">
              <p className="modal-section-label">Rate</p>
              <p className="modal-info-value">{freelancer.rate}</p>
            </div>
            {freelancer.portfolio && (
              <div className="modal-info-box">
                <p className="modal-section-label">Portfolio</p>
                <a href={freelancer.portfolio} target="_blank" rel="noreferrer"
                  className="modal-portfolio-link">View work →</a>
              </div>
            )}
          </div>

          <a href={formatWhatsApp(freelancer.whatsapp)} target="_blank" rel="noreferrer"
            className="modal-whatsapp">
            <span>💬</span> Contact on WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}

// ── Freelancer Card ──
function FreelancerCard({ freelancer, onClick }: { freelancer: Freelancer; onClick: () => void }) {
  const colors = getCategoryColor(freelancer.category);
  return (
    <div className="card" onClick={onClick}>
      <div className="card-top">
        <div className="card-avatar" style={{ background: colors.bg, color: colors.text }}>
          {getInitials(freelancer.name)}
        </div>
        <span className="card-badge" style={{ background: colors.bg, color: colors.text }}>
          {freelancer.category}
        </span>
      </div>
      <h3 className="card-name">{freelancer.name}</h3>
      <p className="card-skill">{freelancer.skill}</p>
      <p className="card-bio">{freelancer.bio}</p>
      <div className="card-footer">
        <span className="card-rate">{freelancer.rate}</span>
        <span className="card-location">📍 {freelancer.state}</span>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function HomePage() {
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All States");
  const [selected, setSelected] = useState<Freelancer | null>(null);

  useEffect(() => {
    const stored = getFreelancers();
    const seededIds = new Set(stored.map(f => f.id));
    const seeds = SEED_FREELANCERS.filter(s => !seededIds.has(s.id));
    setFreelancers([...stored, ...seeds]);
  }, []);

  const filtered = freelancers.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.skill.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || f.category === category;
    const matchState = state === "All States" || f.state === state;
    return matchSearch && matchCat && matchState;
  });

  return (
    <>
      <style>{pageStyles}</style>

      {/* Navbar */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="nav-logo">S</span>
            <span className="nav-logo-text">SkillFind</span>
            <span className="nav-flag">🇳🇬</span>
          </div>
          <button className="nav-cta" onClick={() => router.push("/register")}>
            List Your Skills →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <p className="hero-eyebrow">Nigeria's Freelancer Directory</p>
        <h1 className="hero-title">
          Find skilled professionals<br />
          <span className="hero-accent">across Nigeria</span>
        </h1>
        <p className="hero-sub">
          Browse verified freelancers by skill, category, and state.
        </p>
      </section>

      {/* Search & Filter */}
      <div className="filters-wrap">
        <div className="filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by name or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={state} onChange={e => setState(e.target.value)}>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p className="results-count">
          {filtered.length} freelancer{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Grid */}
      <main className="grid-wrap">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔎</div>
            <h3>No freelancers found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map(f => (
              <FreelancerCard key={f.id} freelancer={f} onClick={() => setSelected(f)} />
            ))}
          </div>
        )}
      </main>

      {selected && <ProfileModal freelancer={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f5f0; font-family: 'DM Sans', sans-serif; }

  /* NAV */
  .nav {
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    position: sticky; top: 0; z-index: 100;
  }
  .nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-brand { display: flex; align-items: center; gap: 8px; }
  .nav-logo {
    width: 32px; height: 32px; background: #16a34a; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px;
    border-radius: 7px; display: flex; align-items: center; justify-content: center;
  }
  .nav-logo-text {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 18px; color: #0f172a;
  }
  .nav-flag { font-size: 18px; }
  .nav-cta {
    background: #16a34a; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 13px;
    padding: 9px 18px; border: none; border-radius: 8px; cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .nav-cta:hover { background: #15803d; transform: translateY(-1px); }

  /* HERO */
  .hero {
    text-align: center;
    padding: 64px 24px 40px;
    max-width: 700px; margin: 0 auto;
  }
  .hero-eyebrow {
    display: inline-block;
    background: #dcfce7; color: #15803d;
    font-size: 12px; font-weight: 500;
    padding: 4px 12px; border-radius: 99px;
    letter-spacing: 0.5px; text-transform: uppercase;
    margin-bottom: 16px;
  }
  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: 44px; font-weight: 800;
    color: #0f172a; line-height: 1.1;
    letter-spacing: -1px; margin-bottom: 14px;
  }
  .hero-accent { color: #16a34a; }
  .hero-sub { font-size: 16px; color: #64748b; }

  /* FILTERS */
  .filters-wrap {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px 16px;
  }
  .filters {
    display: flex; gap: 12px; flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .search-box {
    flex: 1; min-width: 240px;
    position: relative; display: flex; align-items: center;
  }
  .search-icon {
    position: absolute; left: 12px;
    font-size: 14px; pointer-events: none;
  }
  .search-input {
    width: 100%; padding: 10px 36px 10px 36px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: #0f172a; background: #fff;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    outline: none; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: #22c55e; }
  .search-input::placeholder { color: #c0c9d8; }
  .search-clear {
    position: absolute; right: 10px;
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 12px; padding: 4px;
  }
  .filter-select {
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: #374151; background: #fff;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    outline: none; cursor: pointer; appearance: none;
    transition: border-color 0.15s;
    min-width: 150px;
  }
  .filter-select:focus { border-color: #22c55e; }
  .results-count { font-size: 13px; color: #94a3b8; }

  /* GRID */
  .grid-wrap {
    max-width: 1200px; margin: 0 auto;
    padding: 8px 24px 64px;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  /* CARD */
  .card {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    display: flex; flex-direction: column; gap: 8px;
  }
  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    border-color: #bbf7d0;
  }
  .card-top {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 4px;
  }
  .card-avatar {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px;
  }
  .card-badge {
    font-size: 11px; font-weight: 500;
    padding: 3px 10px; border-radius: 99px;
    letter-spacing: 0.2px;
  }
  .card-name {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 17px; color: #0f172a;
  }
  .card-skill {
    font-size: 13px; font-weight: 500; color: #16a34a;
  }
  .card-bio {
    font-size: 13px; color: #64748b; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    flex: 1;
  }
  .card-footer {
    display: flex; align-items: center;
    justify-content: space-between; margin-top: 8px;
    padding-top: 12px; border-top: 1px solid #f1f5f9;
  }
  .card-rate {
    font-family: 'Syne', sans-serif; font-weight: 600;
    font-size: 14px; color: #0f172a;
  }
  .card-location { font-size: 12px; color: #94a3b8; }

  /* EMPTY */
  .empty {
    text-align: center; padding: 80px 24px;
  }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty h3 {
    font-family: 'Syne', sans-serif; font-size: 20px;
    font-weight: 700; color: #0f172a; margin-bottom: 8px;
  }
  .empty p { font-size: 14px; color: #94a3b8; }

  /* MOBILE */
  @media (max-width: 640px) {
    .hero-title { font-size: 30px; }
    .filters { flex-direction: column; }
    .search-box { min-width: unset; }
    .filter-select { width: 100%; }
    .card-grid { grid-template-columns: 1fr; }
  }
`;

const modalStyles = `
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(15,23,42,0.5);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

  .modal-card {
    background: #fff; border-radius: 20px;
    padding: 36px; width: 100%; max-width: 480px;
    position: relative;
    animation: slideUp 0.2s ease;
    max-height: 90vh; overflow-y: auto;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) }
    to { opacity: 1; transform: translateY(0) }
  }

  .modal-close {
    position: absolute; top: 16px; right: 16px;
    background: #f1f5f9; border: none; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer;
    color: #64748b; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.1s;
  }
  .modal-close:hover { background: #e2e8f0; }

  .modal-header {
    display: flex; gap: 16px; align-items: flex-start;
    margin-bottom: 24px;
  }
  .modal-avatar {
    width: 56px; height: 56px; min-width: 56px;
    border-radius: 14px; font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-name {
    font-family: 'Syne', sans-serif; font-weight: 700;
    font-size: 20px; color: #0f172a; margin-bottom: 2px;
  }
  .modal-skill { font-size: 14px; color: #16a34a; font-weight: 500; margin-bottom: 8px; }
  .modal-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .modal-badge {
    font-size: 11px; font-weight: 500;
    padding: 3px 10px; border-radius: 99px;
  }
  .modal-location { font-size: 12px; color: #94a3b8; }

  .modal-section { margin-bottom: 20px; }
  .modal-section-label {
    font-size: 11px; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
  }
  .modal-bio { font-size: 14px; color: #374151; line-height: 1.6; }

  .modal-row {
    display: flex; gap: 16px; margin-bottom: 24px;
  }
  .modal-info-box {
    flex: 1; background: #f8fafc;
    border-radius: 10px; padding: 14px;
  }
  .modal-info-value {
    font-family: 'Syne', sans-serif; font-weight: 600;
    font-size: 15px; color: #0f172a;
  }
  .modal-portfolio-link {
    font-size: 14px; font-weight: 500;
    color: #16a34a; text-decoration: none;
  }
  .modal-portfolio-link:hover { text-decoration: underline; }

  .modal-whatsapp {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; width: 100%; padding: 14px;
    background: #16a34a; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px;
    border-radius: 12px; text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }
  .modal-whatsapp:hover {
    background: #15803d; transform: translateY(-1px);
  }
`;