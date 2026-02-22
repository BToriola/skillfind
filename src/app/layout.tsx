import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillFind 🇳🇬 — Nigeria's Freelancer Directory",
  description: "Find skilled Nigerian freelancers by skill, category, and state. List your skills and get discovered by clients across Nigeria.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}