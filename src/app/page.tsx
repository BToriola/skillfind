"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { signOut } from "@/utils/auth";
import { getFreelancers, getUserFreelancerProfile } from "@/utils/storage";
import { Freelancer } from "@/types";
import { CATEGORIES, NIGERIAN_STATES } from "@/constants";
import FreelancerCard from "@/components/FreelancerCard";
import ProfileModal from "@/components/ProfileModal";
import { Search, LogOut, Plus, User, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [state, setState] = useState("All States");
  const [selected, setSelected] = useState<Freelancer | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    getFreelancers().then((data) => {
      setFreelancers(data);
      setLoadingFreelancers(false);
    });
    if (user) {
      getUserFreelancerProfile(user.id).then(p => setHasProfile(!!p));
    }
  }, [user]);

  const filtered = freelancers.filter(f => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.skill.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All Categories" || f.category === category;
    const matchState = state === "All States" || f.state === state;
    return matchSearch && matchCat && matchState;
  });

  const selectClass = "px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-full outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-green-700 text-white font-extrabold text-base rounded-lg flex items-center justify-center">S</span>
            <span className="font-[family-name:var(--font-bricolage)] font-bold text-lg text-slate-900 tracking-tight">SkillFind</span>
            <span className="text-lg">🇳🇬</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {hasProfile ? (
                  <button onClick={() => router.push("/profile")}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer">
                    Edit Profile
                  </button>
                ) : (
                  <motion.button onClick={() => router.push("/register")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2">
                    List Your Skills <Plus size={16} />
                  </motion.button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg transition cursor-pointer border-none"
                  >
                    Admin
                  </button>
                )}
                <button onClick={async () => { await signOut(); router.refresh(); }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition cursor-pointer bg-transparent border-none flex items-center gap-1.5">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/auth?mode=login")}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-transparent border-none cursor-pointer transition"
                >
                  Sign In
                </button>
                <motion.button
                  onClick={() => router.push("/auth")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer border-none"
                >
                  Sign Up Free →
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center max-w-2xl mx-auto px-6 pt-16 pb-10">
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          <CheckCircle size={12} /> Nigeria&apos;s Freelancer Directory
        </span>
        <h1 className="font-[family-name:var(--font-bricolage)] text-[44px] sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-3">
          Find skilled professionals<br />
          <span className="text-green-700">across Nigeria</span>
        </h1>
        <p className="text-base text-slate-500">
          Browse verified freelancers by skill, category, and state.
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex gap-3 flex-wrap mb-3">
          <div className="relative flex items-center flex-1 min-w-60">
            <Search className="absolute left-3 text-slate-400" size={16} />
            <input
              className="w-full pl-9 pr-9 py-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-full outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 placeholder:text-slate-300 transition"
              placeholder="Search by name or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select className={selectClass} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={selectClass} value={state} onChange={e => setState(e.target.value)}>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(search || category !== "All Categories" || state !== "All States") && (
          <p className="text-[13px] text-slate-400">
            {filtered.length} freelancer{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        {loadingFreelancers ? (
          // Skeleton loader
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3 animate-pulse">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="w-20 h-6 rounded-full bg-slate-200" />
                </div>
                <div className="w-3/4 h-4 rounded-lg bg-slate-200" />
                <div className="w-1/2 h-3 rounded-lg bg-slate-200" />
                <div className="w-full h-3 rounded-lg bg-slate-200" />
                <div className="w-5/6 h-3 rounded-lg bg-slate-200" />
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
                  <div className="w-24 h-4 rounded-lg bg-slate-200" />
                  <div className="w-16 h-3 rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <Search size={48} className="text-slate-200" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">No freelancers found</h3>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.07,
                },
              },
            }}
          >
            {filtered.map(f => (
              <motion.div
                key={f.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className="h-full"
              >
                <FreelancerCard freelancer={f} onClick={() => setSelected(f)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selected && <ProfileModal freelancer={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}