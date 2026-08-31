"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Upload, Clock, XCircle } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { VerificationRequest } from "@/types";
import { ID_TYPES } from "@/constants";
import toast from "react-hot-toast";

type Props = {
  freelancerId: string;
  userId: string;
  isVerified: boolean;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function VerificationSection({ freelancerId, userId, isVerified }: Props) {
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [document, setDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState("");
  const docRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const fetchRequest = useCallback(async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false })
      .limit(1);
    setRequest(data?.[0] ?? null);
    setLoading(false);
  }, [freelancerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequest();
  }, [fetchRequest]);

  function pickFile(file: File | undefined, set: (f: File | null) => void) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Upload a JPG, PNG, WebP or PDF");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 5MB");
      return;
    }
    setError("");
    set(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!document) { setError("Attach a photo of your ID"); return; }
    if (!selfie) { setError("Attach a selfie so we can match it to your ID"); return; }

    setSubmitting(true);
    setError("");

    // Files land in the private `verification` bucket under the user's own
    // folder, which is the only path the storage policy allows them to write.
    const stamp = Date.now();
    const uploaded: string[] = [];

    async function upload(file: File, kind: string): Promise<string | null> {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${stamp}-${kind}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("verification")
        .upload(path, file, { upsert: false });
      if (upErr) return null;
      uploaded.push(path);
      return path;
    }

    const documentPath = await upload(document, "document");
    const selfiePath = documentPath ? await upload(selfie, "selfie") : null;

    if (!documentPath || !selfiePath) {
      // Don't leave half an upload behind in the bucket.
      if (uploaded.length) await supabase.storage.from("verification").remove(uploaded);
      setError("Upload failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase
      .from("verification_requests")
      .insert([{
        freelancer_id: freelancerId,
        user_id: userId,
        id_type: idType,
        document_path: documentPath,
        selfie_path: selfiePath,
        status: "pending",
      }]);

    if (insertErr) {
      await supabase.storage.from("verification").remove(uploaded);
      setError(
        insertErr.code === "23505"
          ? "You already have a request awaiting review."
          : "Could not submit your request. Please try again."
      );
      setSubmitting(false);
      return;
    }

    toast.success("Submitted — we'll review your ID shortly");
    setDocument(null);
    setSelfie(null);
    if (docRef.current) docRef.current.value = "";
    if (selfieRef.current) selfieRef.current.value = "";
    setSubmitting(false);
    await fetchRequest();
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:ring-3 focus:ring-green-100 transition";

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse flex flex-col gap-3">
          <div className="w-40 h-4 bg-slate-200 rounded" />
          <div className="w-full h-3 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // ── Already verified ──
  if (isVerified) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-bricolage font-bold text-slate-900 mb-1">
              Identity verified
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your profile shows a verified badge. Clients can see that we checked a
              government ID matching your name — it makes them far likelier to reach out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pending = request?.status === "pending";
  const rejected = request?.status === "rejected";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="font-bricolage font-bold text-slate-900 mb-1">
            Get verified
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Verified freelancers carry a badge clients trust. We check that your ID
            matches your name — nothing more, and we never publish anything from it.
          </p>
        </div>
      </div>

      {pending && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Under review</p>
            <p className="text-sm text-amber-700">
              You sent a {request?.id_type} on{" "}
              {new Date(request!.created_at).toLocaleDateString("en-NG", {
                day: "numeric", month: "long", year: "numeric",
              })}
              . We&apos;ll let you know once it&apos;s checked.
            </p>
          </div>
        </div>
      )}

      {rejected && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-start mb-5">
          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 mb-0.5">
              We couldn&apos;t verify that
            </p>
            <p className="text-sm text-red-700">
              {request?.rejection_reason || "The document wasn't clear enough to check."}
            </p>
            <p className="text-sm text-red-700 mt-1">You can send another below.</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!pending && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type of ID</label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className={inputClass}
              >
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FilePicker
                label="Photo of your ID"
                hint="JPG, PNG, WebP or PDF · Max 5MB"
                file={document}
                inputRef={docRef}
                onPick={f => pickFile(f, setDocument)}
              />
              <FilePicker
                label="Selfie holding the ID"
                hint="So we can match the photo to you"
                file={selfie}
                inputRef={selfieRef}
                onPick={f => pickFile(f, setSelfie)}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <p className="text-xs text-slate-500 leading-relaxed">
              Your documents go to private storage only an admin can open, and are
              deleted as soon as your request is reviewed. We do not record your ID
              number.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition cursor-pointer border-none"
            >
              {submitting ? "Sending..." : "Submit for verification"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilePicker({
  label, hint, file, inputRef, onPick,
}: {
  label: string;
  hint: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <label
        className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl cursor-pointer transition ${
          file
            ? "border-green-300 bg-green-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        <div className="flex flex-col items-center px-3 text-center pointer-events-none">
          <Upload size={20} className={file ? "text-green-600 mb-1" : "text-slate-300 mb-1"} />
          <span className={`text-xs ${file ? "text-green-700 font-medium" : "text-slate-400"}`}>
            {file ? file.name : "Click to upload"}
          </span>
          {!file && <span className="text-xs text-slate-300 mt-0.5">{hint}</span>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={e => onPick(e.target.files?.[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}
