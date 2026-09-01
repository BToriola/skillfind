import { RATE_TYPES } from "@/constants";
import { RateType } from "@/types";

export function getCategoryColor(category: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    // Keep these class names as full literal strings — Tailwind's scanner
    // only emits classes it finds verbatim in source, so building them
    // dynamically (`bg-${colour}-100`) would silently produce no styles.
    Technology: { bg: "bg-blue-100", text: "text-blue-700" },
    Design: { bg: "bg-pink-100", text: "text-pink-700" },
    Writing: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Marketing: { bg: "bg-orange-100", text: "text-orange-700" },
    "Video & Animation": { bg: "bg-indigo-100", text: "text-indigo-700" },
    Photography: { bg: "bg-purple-100", text: "text-purple-700" },
    Fashion: { bg: "bg-rose-100", text: "text-rose-700" },
    Trades: { bg: "bg-green-100", text: "text-green-700" },
    "Home Services": { bg: "bg-teal-100", text: "text-teal-700" },
    "Business & Consulting": { bg: "bg-amber-100", text: "text-amber-700" },
    Education: { bg: "bg-cyan-100", text: "text-cyan-700" },
    Other: { bg: "bg-slate-100", text: "text-slate-600" },
  };
  return map[category] ?? map["Other"];
}

// "City, State" when a freelancer has set a city/area, otherwise just the
// state — used everywhere a location is displayed so city and state never
// drift out of sync between the card, modal, profile page, and SEO metadata.
export function formatLocation(city: string | null | undefined, state: string) {
  return city?.trim() ? `${city.trim()}, ${state}` : state;
}

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/**
 * Prepares a user-entered link for use in an href.
 * Adds https:// when the protocol is missing — people type "mysite.com",
 * which the browser would otherwise resolve relative to the current page.
 * Returns null for anything that isn't http(s), so a pasted `javascript:`
 * or `data:` URL can't run when a visitor clicks the link.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function formatWhatsApp(number: string) {
  const cleaned = number.replace(/\D/g, "");
  const international = cleaned.startsWith("0") ? "234" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${international}`;
}

/**
 * Reads a Naira amount out of whatever a user typed — "50,000", "₦50000",
 * "50 000" all give 50000. Returns null for anything with no digits.
 */
export function parseNairaAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : null;
}

/**
 * Converts the pricing form's string fields into the numeric/null shape the
 * DB columns expect. Both forms must go through this — writing the raw form
 * strings would send "15,000" to a numeric column, and would let a
 * negotiable row keep amounts, which freelancers_rate_coherent rejects.
 */
export function toPricingPayload(v: {
  rate_type: string;
  rate_min: string;
  rate_max: string;
}): { rate_type: RateType | null; rate_min: number | null; rate_max: number | null } {
  if (!v.rate_type) return { rate_type: null, rate_min: null, rate_max: null };
  if (v.rate_type === "negotiable") {
    return { rate_type: "negotiable", rate_min: null, rate_max: null };
  }

  const min = parseNairaAmount(v.rate_min);
  // A priced type with no amount would violate the DB check, so treat an
  // incomplete entry as "no pricing set" rather than writing a broken row.
  if (min == null) return { rate_type: null, rate_min: null, rate_max: null };

  const max = parseNairaAmount(v.rate_max);
  return {
    rate_type: v.rate_type as RateType,
    rate_min: min,
    rate_max: max != null && max > min ? max : null,
  };
}

/**
 * Renders the structured pricing fields for display.
 *
 * Falls back to the legacy free-text `rate` whenever rate_type is null,
 * so rows that predate 005_backfill_pricing.sql keep rendering exactly as
 * they did instead of silently going blank.
 */
export function formatPricing(
  rateType: RateType | null | undefined,
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
  legacyRate?: string | null
): string {
  if (!rateType) {
    return legacyRate?.trim() ? formatRate(legacyRate) : "Rate on request";
  }
  if (rateType === "negotiable") return "Negotiable";
  if (rateMin == null) return "Rate on request";

  const suffix = RATE_TYPES.find(t => t.value === rateType)?.suffix ?? "";
  const lo = `₦${rateMin.toLocaleString("en-NG")}`;
  const hi = rateMax != null && rateMax > rateMin
    ? ` – ₦${rateMax.toLocaleString("en-NG")}`
    : "";
  return `${lo}${hi}${suffix}`;
}

export function formatRate(rate: string) {
  if (!rate) return rate;

  // Helper: format a single number string → ₦X,XXX
  function formatSingle(val: string): string {
    const stripped = val.trim().replace(/[₦,\s]/g, "");
    const num = parseInt(stripped, 10);
    if (isNaN(num)) return val.trim();
    return `₦${num.toLocaleString("en-NG")}`;
  }

  // Detect a range — split on dash, en-dash, em-dash, slash, "to", "–", "-"
  const rangeSeparator = /\s*[-–—\/](?![\d,]*\s*(?:per|\/|hr|hour|day|month|yr|year|wk|week))\s*|\s+(?:to|and)\s+/i;
  const parts = rate.trim().split(rangeSeparator);

  if (parts.length === 2) {
    const lo = formatSingle(parts[0]);
    const hi = formatSingle(parts[1]);
    return `${lo} – ${hi}`;
  }

  // Single value
  return formatSingle(rate);
}
