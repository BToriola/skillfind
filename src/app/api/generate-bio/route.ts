import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";

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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
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
      }),
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { bio: "", error: data.error?.message || "API error" },
        { status: 500 }
      );
    }

    const bio = data.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ bio });

  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json(
      { bio: "", error: "Failed to generate bio" },
      { status: 500 }
    );
  }
}
