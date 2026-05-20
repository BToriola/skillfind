"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ImagePlus } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { PortfolioItem } from "@/types";

type Props = {
  freelancerId: string;
  canEdit: boolean;
};

export default function PortfolioSection({ freelancerId, canEdit }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_url: "",
    tools_used: "",
  });

  const fetchItems = useCallback(async () => {
    Promise.resolve().then(() => setLoading(true));
    const { data } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [freelancerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG or WebP images allowed");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be under 3MB");
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Project title is required"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }

    setSaving(true);
    setError("");

    let image_url = null;

    // Upload image if selected
    if (selectedImage) {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = selectedImage.name.split(".").pop();
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, selectedImage);

      if (uploadError) {
        setError("Image upload failed. Try again.");
        setSaving(false);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("portfolio")
        .getPublicUrl(filePath);

      image_url = data.publicUrl;
      setUploading(false);
    }

    const { error: insertError } = await supabase
      .from("portfolio_items")
      .insert([{
        freelancer_id: freelancerId,
        title: form.title.trim(),
        description: form.description.trim(),
        image_url,
        project_url: form.project_url.trim() || null,
        tools_used: form.tools_used.trim() || null,
      }]);

    if (insertError) {
      setError("Failed to save. Try again.");
      setSaving(false);
      return;
    }

    setForm({ title: "", description: "", project_url: "", tools_used: "" });
    setSelectedImage(null);
    setImagePreview(null);
    setShowForm(false);
    setSaving(false);
    await fetchItems();
  }

  async function handleDelete(id: string, imageUrl: string | null) {
    if (!confirm("Delete this portfolio item?")) return;

    // Delete image from storage if exists
    if (imageUrl) {
      const path = imageUrl.split("/portfolio/")[1];
      if (path) await supabase.storage.from("portfolio").remove([path]);
    }

    await supabase.from("portfolio_items").delete().eq("id", id);
    await fetchItems();
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 placeholder:text-gray-300 transition resize-none";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bricolage font-bold text-slate-900">Portfolio</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real work speaks louder than words</p>
        </div>
        {canEdit && items.length < 6 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="text-sm font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition cursor-pointer border-none"
          >
            {showForm ? "Cancel" : "+ Add Project"}
          </motion.button>
        )}
      </div>

      {/* Add Project Form */}
      <AnimatePresence>
        {showForm && canEdit && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 rounded-2xl p-5 mb-5 flex flex-col gap-4">
              <p className="text-sm font-semibold text-slate-700">Add a Project</p>

              {/* Image Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Project Screenshot <span className="text-slate-400">(Optional)</span>
                </label>
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center text-slate-500 hover:text-red-500 text-xs cursor-pointer border-none"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-300 hover:bg-green-50 transition">
                    <ImagePlus className="text-slate-300 mb-1" size={28} />
                    <span className="text-xs text-slate-400">Click to upload image</span>
                    <span className="text-xs text-slate-300 mt-0.5">JPG, PNG or WebP · Max 3MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">Project Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. E-commerce Website for Lagos Boutique"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  What did you build and what was the result?
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="e.g. Built a full e-commerce store with payment integration. Client saw 40% increase in online sales within the first month."
                  className={inputClass}
                />
              </div>

              {/* Tools Used */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Tools / Stack Used <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  value={form.tools_used}
                  onChange={e => setForm({ ...form, tools_used: e.target.value })}
                  placeholder="e.g. React, Node.js, Paystack"
                  className={inputClass}
                />
              </div>

              {/* Project URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Project Link <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  value={form.project_url}
                  onChange={e => setForm({ ...form, project_url: e.target.value })}
                  placeholder="https://project-link.com"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <motion.button
                type="submit"
                disabled={saving}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
              >
                {uploading ? "Uploading image..." : saving ? "Saving..." : "Save Project →"}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Portfolio Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-100 overflow-hidden">
              <div className="w-full h-36 bg-slate-200" />
              <div className="p-4 flex flex-col gap-2">
                <div className="w-3/4 h-3 bg-slate-200 rounded" />
                <div className="w-full h-3 bg-slate-200 rounded" />
                <div className="w-1/2 h-3 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <div className="flex justify-center mb-2">
            <Briefcase className="text-slate-200" size={36} />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No projects yet</p>
          <p className="text-xs text-slate-400">
            {canEdit
              ? "Add your first project to show clients what you can do"
              : "This freelancer hasn't added any projects yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-100 rounded-xl overflow-hidden hover:border-green-200 hover:shadow-sm transition group"
            >
              {/* Project Image */}
              {item.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-36 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center">
                  <Briefcase className="text-slate-300" size={40} />
                </div>
              )}

              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bricolage font-bold text-slate-900 text-sm leading-tight">
                    {item.title}
                  </h3>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(item.id, item.image_url)}
                      className="text-xs text-slate-300 hover:text-red-500 bg-transparent border-none cursor-pointer transition opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {item.tools_used && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tools_used.split(",").map(tool => (
                      <span
                        key={tool}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                      >
                        {tool.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {item.project_url && (
                  <a
                    href={item.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-green-600 hover:underline mt-1"
                  >
                    View Project →
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {canEdit && items.length >= 6 && (
        <p className="text-xs text-slate-400 text-center mt-4">
          Maximum 6 projects reached. Delete one to add another.
        </p>
      )}
    </div>
  );
}
