import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { groqChat } from "@/utils/groq";

export async function POST(req: NextRequest) {
  // Get IP address
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  // Allow max 5 requests per 10 minutes per IP
  const limit = rateLimit(ip, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    const resetInMinutes = Math.ceil(limit.resetIn / 1000 / 60);
    return NextResponse.json(
      {
        bio: "",
        error: `Too many requests. Please wait ${resetInMinutes} minute${resetInMinutes > 1 ? "s" : ""} before trying again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.resetIn / 1000)),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  }

  const { name, skill, experience, strength, state } = await req.json();

  try {
    const bio = await groqChat({
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a professional bio writer for Nigerian freelancers. You write concise, confident, first-person bios. You never use buzzwords like 'passionate' or 'guru'. You always return ONLY the bio text with no extra commentary.",
        },
        {
          role: "user",
          content: `Write a short professional freelancer bio for:
- Name: ${name}
- Skill/Role: ${skill}
- Years of Experience: ${experience}
- Top Strength: ${strength}
- State: ${state}, Nigeria

Rules:
- Maximum 3 sentences
- First person
- Confident and professional
- Mention their state or Nigeria naturally
- End with the value they bring to clients
- Return ONLY the bio text`,
        },
      ],
    });

    return NextResponse.json({ bio });

  } catch (err) {
    console.error("generate-bio failed:", err);
    return NextResponse.json(
      { bio: "", error: err instanceof Error ? err.message : "Failed to generate bio" },
      { status: 500 }
    );
  }
}
