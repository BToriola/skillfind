import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { groqChat } from "@/utils/groq";
import { CATEGORIES, NIGERIAN_STATES } from "@/constants";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(ip, {
    scope: "smart-search",
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    const resetInMinutes = Math.ceil(limit.resetIn / 1000 / 60);
    return NextResponse.json(
      { error: `Too many searches. Please wait ${resetInMinutes} minutes.` },
      { status: 429 }
    );
  }

  const { query } = await req.json();

  if (!query || !query.trim()) {
    return NextResponse.json({
      keywords: [],
      category: "All",
      state: "All States",
      explanation: "",
    });
  }

  try {
    const content = await groqChat({
      maxTokens: 200,
      jsonMode: true,
      messages: [
        {
          role: "system",
          content: `You are the search understanding layer for SkillFind, a Nigerian freelancer directory.
Given a client's plain-language request, extract structured search intent.

Categories (pick exactly one, or "All"): ${CATEGORIES.join(", ")}, All
States (pick exactly one if mentioned, or "All States"): ${NIGERIAN_STATES.join(", ")}, All States

Respond ONLY with valid JSON, no prose, in this exact shape:
{"keywords": ["word1","word2"], "category": "CategoryName", "state": "StateName", "explanation": "one short friendly sentence explaining what you searched for"}

"keywords" should be 1–4 specific skill/role words (e.g. ["logo","branding"] not the whole sentence).
"explanation" should read naturally and be shown to the user (e.g. "Looking for logo designers in Lagos").`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    const parsed = JSON.parse(content || "{}");

    return NextResponse.json({
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [query],
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "All",
      state: NIGERIAN_STATES.includes(parsed.state) ? parsed.state : "All States",
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
    });
  } catch (err) {
    console.error("smart-search failed:", err);
    return NextResponse.json({
      keywords: [query],
      category: "All",
      state: "All States",
      explanation: "",
    });
  }
}
