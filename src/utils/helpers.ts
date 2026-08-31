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
