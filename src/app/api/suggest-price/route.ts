import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";

export async function POST(req: NextRequest) {
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
        suggestion: "",
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

  const { skill, category, experience, state } = await req.json();

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: "You are a Nigerian freelance market expert. You suggest fair, realistic rates in Nigerian Naira based on skill, experience and location. You always return ONLY the rate suggestion in the exact format requested with no extra commentary.",
          },
          {
            role: "user",
            content: `Suggest a fair freelance rate for a Nigerian professional:
- Skill/Role: ${skill}
- Category: ${category}
- Experience: ${experience}
- State: ${state}, Nigeria

Return ONLY these two lines, nothing else:
Hourly: ₦X,000 - ₦Y,000/hr
Per Project: ₦X,000 - ₦Y,000/project`,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { suggestion: "", error: data.error?.message || "API error" },
        { status: 500 }
      );
    }

    const suggestion = data.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ suggestion });

  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json(
      { suggestion: "", error: "Failed to get suggestion" },
      { status: 500 }
    );
  }
}
