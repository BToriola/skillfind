import { MetadataRoute } from "next";

// Auth-gated and admin-only pages are disallowed here — they can't be
// crawled meaningfully anyway (every visit redirects to /auth), so letting
// Google spend crawl budget on them just slows down indexing the pages that
// actually matter: the homepage and every freelancer profile.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile", "/register", "/auth", "/reset-password", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
