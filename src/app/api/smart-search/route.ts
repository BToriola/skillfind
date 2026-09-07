import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { groqChat } from "@/utils/groq";
import { CATEGORIES } from "@/constants";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  // Allow max 20 requests per 10 minutes for search (more generous). Its own
  // budget now — searching is the highest-volume route, so sharing a pool meant
  // it starved the two one-off writers on the register and profile forms.
  const limit = rateLimit(ip, {
    scope: "smart-search",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    const resetInMinutes = Math.ceil(limit.resetIn / 1000 / 60);
    return NextResponse.json(
      { keyword: "", category: "All", error: `Too many requests. Please wait ${resetInMinutes} minutes.` },
      { status: 429 }
    );
  }

  const { query } = await req.json();

  try {
    const content = await groqChat({
      maxTokens: 200,
      jsonMode: true,
      messages: [
        {
          role: "system",
          content: `You are a search assistant for SkillFind, a Nigerian freelancer directory.
When given a natural language query, extract the most relevant search keyword and category.
Always respond in valid JSON only with this exact format:
{"keyword": "search term", "category": "category name or All"}
Available categories: ${CATEGORIES.join(", ")}, All`,
        },
        {
          role: "user",
          content: `Extract search intent from this query: "${query}"`,
        },
      ],
    });

    const parsed = JSON.parse(content || "{}");
    return NextResponse.json({
      keyword: parsed.keyword || query,
      category: parsed.category || "All",
    });

  } catch (err) {
    // Falling back to the raw query still gives a usable search.
    console.error("smart-search failed:", err);
    return NextResponse.json({ keyword: query, category: "All" });
  }
}
