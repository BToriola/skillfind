// "Other" stays last — it's the fallback option in every category dropdown.
// Adding here is enough: getCategoryColor() gives the badge its colour and
// the smart-search prompt builds its list from this array.
export const CATEGORIES = [
  // Creative / digital
  "Technology", "Design", "Writing", "Marketing",
  "Video & Animation", "Photography", "Fashion",
  // Hands-on / local services
  "Trades", "Home Services",
  // Professional
  "Business & Consulting", "Education",
  "Other",
];

// Pricing models. Must stay in step with the freelancers_rate_type_valid
// CHECK constraint in 004_structured_pricing.sql.
//
// "negotiable" is deliberately a real option, not a fallback: a plumber or
// electrician genuinely can't quote before seeing the job, and forcing them
// to invent a number produces worse data than an honest "depends".
export const RATE_TYPES = [
  { value: "hourly",     label: "Per hour",    suffix: "/hr" },
  { value: "daily",      label: "Per day",     suffix: "/day" },
  { value: "project",    label: "Per project", suffix: "/project" },
  { value: "item",       label: "Per item",    suffix: "/item" },
  { value: "negotiable", label: "Negotiable — depends on the job", suffix: "" },
] as const;

// Accepted proof of identity. Must stay in step with the
// verification_id_type_valid CHECK constraint in 002_verification.sql.
export const ID_TYPES = [
  "NIN Slip",
  "Driver's License",
  "Voter's Card",
  "International Passport",
];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];
