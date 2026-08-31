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
import { Search, LogOut, Plus, X, Globe, MessageCircle, Menu, ChevronDown } from "lucide-react";
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
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getFreelancers().then((data) => {
      setFreelancers(data);
      setLoadingFreelancers(false);
    });
    if (user) {
      getUserFreelancerProfile(user.id).then(profile => {
        setHasProfile(!!profile);
        if (!profile) setShowProfileNudge(true);
      });
    }
  }, [user]);

  // Array.prototype.sort is stable (guaranteed since ES2019), so this only
  // moves verified freelancers ahead of unverified ones — it doesn't disturb
  // the newest-first ordering getFreelancers() already applied within each group.
  const filtered = freelancers
    .filter(f => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.skill.toLowerCase().includes(search.toLowerCase()) ||
        (f.city?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = category === "All Categories" || f.category === category;
      const matchState = state === "All States" || f.state === state;
      return matchSearch && matchCat && matchState;
    })
    .sort((a, b) => Number(!!b.is_verified) - Number(!!a.is_verified));

  // rounded-xl matches the inputClass used by every other text field in the
  // app (register/profile/auth forms) — a pill (rounded-full) was previously
  // used only here, an outlier against the rest of the product's shape language.
  // appearance-none strips the native arrow so it can be styled consistently
  // across browsers — ChevronDown below replaces it, positioned absolutely
  // and set pointer-events-none so clicks still reach the select.
  const selectClass = "pl-4 pr-9 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition appearance-none cursor-pointer w-full md:w-auto";

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* Navbar */}
      <nav className={`bg-white border-b border-slate-200 sticky top-0 z-20 transition-shadow duration-200 ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-green-700 text-white font-extrabold text-base rounded-lg flex items-center justify-center">S</span>
            <span className="font-bricolage font-bold text-lg text-slate-900 tracking-tight">SkillFind</span>
            <Globe className="text-green-600" size={20} />
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-3">
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
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 border-none">
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

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 -mr-2 text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/20 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-slate-100"
            >
              <div className="flex flex-col px-6 py-4 gap-4">
                {user ? (
                  <>
                    {hasProfile ? (
                      <button onClick={() => { router.push("/profile"); setMobileMenuOpen(false); }}
                        className="w-full text-left font-semibold text-green-600 bg-transparent border-none py-2 cursor-pointer">
                        Edit Profile
                      </button>
                    ) : (
                      <button onClick={() => { router.push("/register"); setMobileMenuOpen(false); }}
                        className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 border-none">
                        List Your Skills <Plus size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { router.push("/admin"); setMobileMenuOpen(false); }}
                        className="w-full text-left font-semibold text-red-600 bg-transparent border-none py-2 cursor-pointer"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button onClick={async () => { await signOut(); router.refresh(); setMobileMenuOpen(false); }}
                      className="w-full text-left font-semibold text-slate-500 bg-transparent border-none py-2 cursor-pointer flex items-center gap-2">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { router.push("/auth?mode=login"); setMobileMenuOpen(false); }}
                      className="w-full text-left font-semibold text-slate-600 bg-transparent border-none py-2 cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { router.push("/auth"); setMobileMenuOpen(false); }}
                      className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg border-none"
                    >
                      Sign Up Free
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {showProfileNudge && !hasProfile && user && (
        <div className="bg-green-600 text-white px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-medium">
               Takes 2 minutes — list your skills now and start getting found by clients today
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/register")}
                className="bg-white text-green-600 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-green-50 transition cursor-pointer border-none"
              >
                Complete My Profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero — max-w-6xl matches the nav/filters/grid below so the page's
          outer edges stay constant while scrolling; the paragraph keeps its
          own narrower max-w-2xl for readability. */}
      <section className="max-w-6xl mx-auto text-center px-6 pt-6 pb-4 md:pt-16 md:pb-6">
        <span className="inline-block bg-green-100 text-green-700 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide mb-4">
          Nigeria&apos;s Freelancer Directory — Free to Join
        </span>
        {/* Line 1 speaks to clients searching (now genuinely local, since
            freelancers can list a City/Area) — line 2 speaks to freelancers
            deciding whether to join (broad reach, across the country). Two
            different audiences, kept as two lines on purpose. */}
        <h1 className="font-bricolage text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
          Find skilled professionals near you.<br className="hidden sm:block" />
          <span className="text-green-600">Get hired across Nigeria.</span>
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
          SkillFind connects Nigerian freelancers with clients who need their skills —
          search by name, skill or area to find someone near you, with no bidding
          wars and no commissions, ever.
        </p>
        {!user && (
          <div className="flex items-center justify-center gap-3 flex-wrap mt-8">
            <button
              onClick={() => router.push("/auth")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer border-none text-xs"
            >
              List Your Skills Free →
            </button>
            <button
              onClick={() => {
                document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white border border-gray-200 hover:border-green-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer text-xs"
            >
              Browse Freelancers ↓
            </button>
          </div>
        )}
      </section>

      {/* Stats bar — was `hidden md:block`, so this trust signal never
          appeared on mobile at all. Each stat used to be two stacked lines
          (a big number, then a label) inside a 2-col grid, which used roughly
          4x the vertical space it needed on a phone. Collapsed each stat to
          one inline unit ("13+ Freelancers") in a single wrapping row instead
          — always a pill, since it's now short enough to rarely need two
          lines even on a narrow phone. Outer wrapper matches the
          hero/filters/grid max-w-6xl; the pill itself stays cozy at max-w-2xl
          so it doesn't stretch edge-to-edge on wide screens. */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl px-5 py-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bricolage text-sm font-bold text-slate-900">{freelancers.length}+</span>
            <span className="text-xs text-slate-500">Freelancers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bricolage text-sm font-bold text-slate-900">36</span>
            <span className="text-xs text-slate-500">States</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bricolage text-sm font-bold text-slate-900">Free</span>
            <span className="text-xs text-slate-500">No Commissions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="text-slate-900" size={14} />
            <span className="text-xs text-slate-500">Direct Chat</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="directory" className="max-w-6xl mx-auto px-6 pb-3">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-3">
          <div className="relative flex items-center flex-1 min-w-60">
            <Search className="absolute left-3 text-slate-500" size={16} />
            <input
              className="w-full pl-9 pr-9 py-2.5 md:py-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 placeholder:text-slate-300 transition"
              placeholder="Search by name, skill or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setSearch("")}
                  className="absolute right-3 text-slate-500 hover:text-slate-600 bg-transparent border-none"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <select className={`${selectClass} w-full py-2.5 md:py-3.5`} value={category} onChange={e => setCategory(e.target.value)}>
                {["All Categories", ...CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
            <div className="relative flex-1">
              <select className={`${selectClass} w-full py-2.5 md:py-3.5`} value={state} onChange={e => setState(e.target.value)}>
                {["All States", ...NIGERIAN_STATES].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {(search || category !== "All Categories" || state !== "All States") && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[13px] text-slate-500 overflow-hidden"
            >
              {filtered.length} freelancer{filtered.length !== 1 ? "s" : ""} found
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-16">
        {loadingFreelancers ? (
          // Skeleton loader — column breakpoints must match the real grid
          // below (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3). This used to
          // be auto-fill/minmax, which produced a different column count on
          // wide screens, so the whole grid visibly reflowed the instant
          // loading skeletons were replaced by cards.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20"
          >
            <div className="flex justify-center mb-4">
              <Search size={48} className="text-slate-200" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-2">No freelancers found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {/* popLayout removes an exiting card from the grid immediately so the
                remaining cards can reflow into its space, rather than sitting in
                an empty gap until the fade-out finishes. */}
            <AnimatePresence mode="popLayout">
              {filtered.map(f => (
                <motion.div
                  key={f.id}
                  layout
                  className="h-full"
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                >
                  <FreelancerCard freelancer={f} onClick={() => setSelected(f)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selected && <ProfileModal freelancer={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}