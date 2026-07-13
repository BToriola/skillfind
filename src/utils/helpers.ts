export function getCategoryColor(category: string): { bg: string; text: string } {
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

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
