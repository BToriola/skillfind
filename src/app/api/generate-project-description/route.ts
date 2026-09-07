import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { groqChat } from "@/utils/groq";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  // A freelancer can hold 6 projects and may regenerate a few, so the ceiling
  // is higher here than for a one-off bio.
  const limit = rateLimit(ip, {
    scope: "generate-project-description",
    maxRequests: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    const resetInMinutes = Math.ceil(limit.resetIn / 1000 / 60);
    return NextResponse.json(
      {
        description: "",
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

  const { title, tools, skill } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json(
      { description: "", error: "A project title is required" },
      { status: 400 }
    );
  }

  try {
    const description = await groqChat({
      maxTokens: 300,
      messages: [
        {
          role: "system",
          content: "You write short portfolio project descriptions for Nigerian freelancers. You write in first person, plainly and concretely, and you never use buzzwords like 'passionate', 'cutting-edge' or 'guru'. You return ONLY the description text with no extra commentary, no heading and no quotation marks.",
        },
        {
          role: "user",
          content: `Write a portfolio project description for:
- Project title: ${title}
- Freelancer's trade: ${skill || "freelancer"}
- Tools or materials used: ${tools?.trim() || "not specified"}

Rules:
- Exactly 2 sentences
- Sentence 1: what the project was and what I did
- Sentence 2: the outcome or benefit for the client, kept believable and general
- Never invent specific numbers, percentages, client names or brand names
- First person, past tense
- Return ONLY the description text`,
        },
      ],
    });

    return NextResponse.json({ description });

  } catch (err) {
    console.error("generate-project-description failed:", err);
    return NextResponse.json(
      { description: "", error: err instanceof Error ? err.message : "Failed to generate description" },
      { status: 500 }
    );
  }
}
