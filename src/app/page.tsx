"use client";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/utils/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFreelancers } from "@/utils/storage";
import { Freelancer } from "@/types";
import {
  Search,
  MapPin,
  MessageSquare,
  ExternalLink,
  LogOut,
  Plus,
  User,
  CheckCircle,
  X
} from "lucide-react";

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

const SEED_FREELANCERS: Freelancer[] = [
  { id: "seed-1", user_id: "seed-user-1", name: "Amara Okafor", skill: "React Developer", category: "Technology", state: "Lagos", bio: "5 years building fast, scalable web apps with React and Next.js. Former engineer at a Lagos fintech.", rate: "₦15,000/hr", whatsapp: "08011111111", portfolio: "https://amaradev.com", avatar_url: null, is_approved: true, created_at: new Date().toISOString() },
  { id: "seed-2", user_id: "seed-user-2", name: "Tunde Adeyemi", skill: "Logo & Brand Designer", category: "Design", state: "Oyo", bio: "I help startups and small businesses build memorable brand identities. 200+ clients served.", rate: "₦80,000/project", whatsapp: "08022222222", portfolio: "", avatar_url: null, is_approved: true, created_at: new Date().toISOString() },
  { id: "seed-3", user_id: "seed-user-3", name: "Ngozi Eze", skill: "Copywriter & Content Strategist", category: "Writing", state: "Enugu", bio: "SEO-focused content writer for SaaS, fintech, and e-commerce brands. Fast turnaround.", rate: "₦5,000/article", whatsapp: "08033333333", portfolio: "https://ngoziwrites.com", avatar_url: null, is_approved: true, created_at: new Date().toISOString() },
]

function getCategoryColor(category: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    Technology: { bg: "bg-blue-100", text: "text-blue-700" },
    Design: { bg: "bg-pink-100", text: "text-pink-700" },
    Writing: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Marketing: { bg: "bg-orange-100", text: "text-orange-700" },
    Trades: { bg: "bg-green-100", text: "text-green-700" },
    Photography: { bg: "bg-purple-100", text: "text-purple-700" },
    Education: { bg: "bg-cyan-100", text: "text-cyan-700" },
    Other: { bg: "bg-slate-100", text: "text-slate-600" },
  };
  return map[category] ?? map["Other"];
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
  const { bg, text } = getCategoryColor(freelancer.category);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-9 w-full max-w-lg relative max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex gap-4 items-start mb-6">
          <div className={`w-14 h-14 min-w-[56px] rounded-2xl flex items-center justify-center font-bold text-xl ${bg} ${text}`}>
            {getInitials(freelancer.name)}
          </div>
          <div>
            <h2 className="font-bold text-xl text-slate-900 mb-0.5">{freelancer.name}</h2>
            <p className="text-sm font-medium text-green-700 mb-2">{freelancer.skill}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${bg} ${text}`}>
                {freelancer.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" /> {freelancer.state}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">About</p>
          <p className="text-sm text-gray-700 leading-relaxed">{freelancer.bio}</p>
        </div>

        {/* Rate + Portfolio */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rate</p>
            <p className="font-semibold text-slate-900 text-[15px]">{freelancer.rate}</p>
          </div>
          {freelancer.portfolio && (
            <div className="flex-1 bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Portfolio</p>
              <a
                href={freelancer.portfolio}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-green-700 hover:underline flex items-center gap-1"
              >
                View work <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* WhatsApp CTA */}
        <a
          href={formatWhatsApp(freelancer.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-700 hover:bg-green-800 hover:-translate-y-0.5 text-white font-semibold text-[15px] rounded-xl transition"
        >
          <MessageSquare size={18} /> Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Freelancer Card ──
function FreelancerCard({ freelancer, onClick }: { freelancer: Freelancer; onClick: () => void }) {
  const { bg, text } = getCategoryColor(freelancer.category);
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer flex flex-col gap-2 transition hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-green-200"
    >
      <div className="flex items-center justify-between mb-1">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${bg} ${text}`}>
          {getInitials(freelancer.name)}
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${bg} ${text}`}>
          {freelancer.category}
        </span>
      </div>
      <h3 className="font-bold text-[17px] text-slate-900">{freelancer.name}</h3>
      <p className="text-[13px] font-medium text-green-700">{freelancer.skill}</p>
      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 flex-1">{freelancer.bio}</p>
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
        <span className="font-semibold text-sm text-slate-900">{freelancer.rate}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MapPin size={12} /> {freelancer.state}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All States");
  const [selected, setSelected] = useState<Freelancer | null>(null);

  useEffect(() => {
    getFreelancers().then(data => {
      if (data.length === 0) {
        setFreelancers(SEED_FREELANCERS);
      } else {
        setFreelancers(data);
      }
    });
  }, []);

  const filtered = freelancers.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.skill.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || f.category === category;
    const matchState = state === "All States" || f.state === state;
    return matchSearch && matchCat && matchState;
  });

  const inputBase = "px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-green-700 text-white font-extrabold text-base rounded-lg flex items-center justify-center">S</span>
            <span className="font-bold text-lg text-slate-900 tracking-tight">SkillFind</span>
            <span className="text-lg">🇳🇬</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2"
                >
                  List Your Skills <Plus size={16} />
                </button>
                <button
                  onClick={async () => { await signOut(); router.refresh(); }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition cursor-pointer bg-transparent border-none flex items-center gap-1.5"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                Sign In <User size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="text-center max-w-2xl mx-auto px-6 pt-16 pb-10">
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          <CheckCircle size={12} /> Nigeria's Freelancer Directory
        </span>
        <h1 className="text-[44px] sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-3">
          Find skilled professionals<br />
          <span className="text-green-700">across Nigeria</span>
        </h1>
        <p className="text-base text-slate-500">
          Browse verified freelancers by skill, category, and state.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex gap-3 flex-wrap mb-3">
          <div className="relative flex items-center flex-1 min-w-60">
            <Search className="absolute left-3 text-slate-400" size={16} />
            <input
              className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 placeholder:text-slate-300 transition"
              placeholder="Search by name or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select className={inputBase} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={inputBase} value={state} onChange={e => setState(e.target.value)}>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p className="text-[13px] text-slate-400">
          {filtered.length} freelancer{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <Search size={48} className="text-slate-200" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">No freelancers found</h3>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {filtered.map(f => (
              <FreelancerCard key={f.id} freelancer={f} onClick={() => setSelected(f)} />
            ))}
          </div>
        )}
      </main>

      {selected && <ProfileModal freelancer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}