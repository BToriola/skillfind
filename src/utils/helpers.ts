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
  const trimmed = rate.trim();

  // Add ₦ if missing
  const withSymbol = trimmed.startsWith("₦") ? trimmed : `₦${trimmed}`;

  // Format any plain number sequence that doesn't already have commas
  // e.g. 1000000 → 1,000,000 but leave 1,000,000 alone
  return withSymbol.replace(/\d+/g, (num) => {
    // Only format if the number is long enough to need commas
    if (num.length <= 3) return num;
    return parseInt(num).toLocaleString("en-NG");
  });
}
