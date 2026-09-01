"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RATE_TYPES } from "@/constants";

export type PricingValue = {
  rate_type: string;
  rate_min: string;
  rate_max: string;
};

type Props = {
  value: PricingValue;
  onChange: (next: PricingValue) => void;
  inputClass: string;
  /** Optional error message shown under the amount row. */
  error?: string;
};

/**
 * Pricing model + amount, shared by the register and profile forms.
 *
 * Choosing "Negotiable" collapses the amount inputs entirely rather than
 * greying them out — for a plumber or electrician who can't quote before
 * seeing the job, that path is one tap and *fewer* fields than before,
 * which is what keeps this from adding friction for the trades.
 */
export default function PricingFields({ value, onChange, inputClass, error }: Props) {
  const isNegotiable = value.rate_type === "negotiable";
  const showAmounts = !!value.rate_type && !isNegotiable;

  function set(patch: Partial<PricingValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          How do you charge? <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <select
          name="rate_type"
          value={value.rate_type}
          onChange={e =>
            // Clearing the amounts when switching to Negotiable keeps the
            // form in step with the DB's freelancers_rate_coherent check,
            // which rejects a negotiable row that still carries figures.
            e.target.value === "negotiable"
              ? set({ rate_type: e.target.value, rate_min: "", rate_max: "" })
              : set({ rate_type: e.target.value })
          }
          className={inputClass}
        >
          <option value="">Select pricing</option>
          {RATE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <AnimatePresence initial={false}>
        {showAmounts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">From (₦)</label>
                <input
                  name="rate_min"
                  value={value.rate_min}
                  onChange={e => set({ rate_min: e.target.value })}
                  inputMode="numeric"
                  placeholder="15,000"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600">
                  To (₦) <span className="text-gray-400 font-normal">optional</span>
                </label>
                <input
                  name="rate_max"
                  value={value.rate_max}
                  onChange={e => set({ rate_max: e.target.value })}
                  inputMode="numeric"
                  placeholder="30,000"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Leave &ldquo;To&rdquo; blank if you charge a single flat rate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNegotiable && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-slate-400 overflow-hidden"
          >
            Your listing will show <span className="font-semibold text-slate-500">Negotiable</span> —
            clients will message you for a quote.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-500 overflow-hidden block"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
