import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "700"],
});

// metadataBase resolves any relative OG/twitter image path against the real
// domain instead of Next guessing — without it, Next logs a warning and
// falls back to localhost, which is exactly wrong for a shared social preview.
// NEXT_PUBLIC_SITE_URL must be set to the real production domain wherever
// this is deployed, or every shared link's preview silently points at
// localhost — check this before going live.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SkillFind 🇳🇬 — Nigeria's Freelancer Directory",
  description: "Find skilled Nigerian freelancers by skill, category, and state.",
  openGraph: {
    title: "SkillFind 🇳🇬 — Nigeria's Freelancer Directory",
    description: "Find skilled Nigerian freelancers by skill, category, and state.",
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary",
    title: "SkillFind 🇳🇬 — Nigeria's Freelancer Directory",
    description: "Find skilled Nigerian freelancers by skill, category, and state.",
  },
  // Google Search Console domain-ownership token (HTML tag method) —
  // renders as <meta name="google-site-verification" content="..." />.
  // Removing this after verification would un-verify the property, so it
  // stays here permanently, not just for the initial check.
  verification: {
    google: "tqbQfMBAtS66WfheLgDVjEttlkZioO8E_xFQMRimLMw",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="font-[family-name:var(--font-dm)] bg-[#f5f5f0]" suppressHydrationWarning>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
                fontFamily: "var(--font-dm)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              },
              success: {
                iconTheme: { primary: "#16a34a", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}