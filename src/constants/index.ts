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
