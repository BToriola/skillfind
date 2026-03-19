"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/utils/supabase";
import { Freelancer } from "@/types";
import { Briefcase, Fingerprint, Award, MapPinned } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  business_name: string | null;
  created_at: string;
};

type Review = {
  id: string;
  freelancer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { email: string };
};

type Stats = {
  totalFreelancers: number;
  totalUsers: number;
  totalReviews: number;
  byCategory: Record<string, number>;
  byState: Record<string, number>;
};

type Tab = "overview" | "freelancers" | "users" | "reviews";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, checkingAdmin } = useAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!checkingAdmin) {
      if (!isAdmin) { router.push("/"); return; }
      fetchAll();
    }
  }, [isAdmin, checkingAdmin]);

  async function fetchAll() {
    setLoading(true);
    const [
      { data: freelancerData },
      { data: userData },
      { data: reviewData },
    ] = await Promise.all([
      supabase.from("freelancers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*, profiles(email)").order("created_at", { ascending: false }),
    ]);

    const f = freelancerData || [];
    const u = userData || [];
    const r = reviewData || [];

    setFreelancers(f);
    setUsers(u);
    setReviews(r);

    // Compute stats
    const byCategory: Record<string, number> = {};
    const byState: Record<string, number> = {};
    f.forEach(fr => {
      byCategory[fr.category] = (byCategory[fr.category] || 0) + 1;
      byState[fr.state] = (byState[fr.state] || 0) + 1;
    });

    setStats({
      totalFreelancers: f.length,
      totalUsers: u.length,
      totalReviews: r.length,
      byCategory,
      byState,
    });

    setLoading(false);
  }

  async function toggleApproval(freelancer: Freelancer) {
    await supabase
      .from("freelancers")
      .update({ is_approved: !freelancer.is_approved })
      .eq("id", freelancer.id);
    await fetchAll();
  }

  async function deleteFreelancer(id: string) {
    if (!confirm("Delete this freelancer profile permanently?")) return;
    await supabase.from("freelancers").delete().eq("id", id);
    await fetchAll();
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    await fetchAll();
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user account permanently?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    await fetchAll();
  }

  const filteredFreelancers = freelancers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.skill.toLowerCase().includes(search.toLowerCase()) ||
    f.state.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    r.comment.toLowerCase().includes(search.toLowerCase()) ||
    r.profiles?.email.toLowerCase().includes(search.toLowerCase())
  );

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer border-none ${
      tab === t
        ? "bg-green-600 text-white"
        : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer bg-transparent border-none">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="font-bricolage font-bold text-lg text-slate-900">SkillFind</span>
            </button>
            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer">
            ← Back to Site
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-bricolage text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Manage all freelancers, users, and reviews on SkillFind</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {(["overview", "freelancers", "users", "reviews"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); }} className={tabClass(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "freelancers" && <span className="ml-1.5 text-xs opacity-70">({stats?.totalFreelancers})</span>}
              {t === "users" && <span className="ml-1.5 text-xs opacity-70">({stats?.totalUsers})</span>}
              {t === "reviews" && <span className="ml-1.5 text-xs opacity-70">({stats?.totalReviews})</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && stats && (
          <div className="flex flex-col gap-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Freelancers", value: stats.totalFreelancers, icon: <Briefcase size={22} strokeWidth={1.5} />, color: "bg-blue-50 text-blue-600 border-blue-100", highlight: "bg-blue-500" },
                { label: "Total Users", value: stats.totalUsers, icon: <Fingerprint size={22} strokeWidth={1.5} />, color: "bg-green-50 text-green-600 border-green-100", highlight: "bg-green-500" },
                { label: "Total Reviews", value: stats.totalReviews, icon: <Award size={22} strokeWidth={1.5} />, color: "bg-amber-50 text-amber-600 border-amber-100", highlight: "bg-amber-400" },
                { label: "Active States", value: Object.keys(stats.byState).length, icon: <MapPinned size={22} strokeWidth={1.5} />, color: "bg-purple-50 text-purple-600 border-purple-100", highlight: "bg-purple-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition duration-300">
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-[1.8] group-hover:opacity-10 ${stat.highlight}`} />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 relative z-10 border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mb-1 relative z-10">{stat.value}</p>
                  <p className="text-sm font-medium text-slate-500 relative z-10">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bricolage font-bold text-slate-900 mb-4">Freelancers by Category</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-28">{cat}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(count / stats.totalFreelancers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-4">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top States */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bricolage font-bold text-slate-900 mb-4">Top States</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(stats.byState)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([state, count]) => (
                      <div key={state} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-28 flex items-center gap-1.5"><MapPinned size={14} className="text-slate-400" /> {state}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(count / stats.totalFreelancers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 w-4">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FREELANCERS TAB ── */}
        {tab === "freelancers" && (
          <div className="flex flex-col gap-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, skill or state..."
              className="w-full max-w-md px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100"
            />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Freelancer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">State</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFreelancers.map((f, i) => (
                    <tr key={f.id} className={`border-b border-gray-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt={f.name} className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                              {getInitials(f.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{f.name}</p>
                            <p className="text-xs text-slate-400">{f.skill}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{f.category}</td>
                      <td className="px-6 py-4 text-slate-600 hidden lg:table-cell"><div className="flex items-center gap-1.5"><MapPinned size={14} className="text-slate-400" /> {f.state}</div></td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">
                        {new Date(f.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          f.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {f.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleApproval(f)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border-none cursor-pointer transition ${
                              f.is_approved
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {f.is_approved ? "Suspend" : "Approve"}
                          </button>
                          <button
                            onClick={() => deleteFreelancer(f.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 border-none cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFreelancers.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No freelancers found</div>
              )}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="flex flex-col gap-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full max-w-md px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100"
            />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Business</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gray-50 hover:bg-slate-50 transition ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.full_name || "—"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{u.business_name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.role === "admin" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">
                        {new Date(u.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 border-none cursor-pointer transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab === "reviews" && (
          <div className="flex flex-col gap-4">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full max-w-md px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-sm ${star <= review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">By {review.profiles?.email?.split("@")[0]}</p>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 border-none cursor-pointer transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredReviews.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No reviews found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
