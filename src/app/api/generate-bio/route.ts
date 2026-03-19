import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, skill, experience, strength, state } = await req.json();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Write a short, professional freelancer bio for a Nigerian professional with these details:
- Name: ${name}
- Skill/Role: ${skill}
- Years of Experience: ${experience}
- Top Strength: ${strength}
- State: ${state}, Nigeria

Rules:
- Maximum 3 sentences
- Write in first person
- Sound confident and professional
- Mention Nigeria or their state naturally
- Do NOT use buzzwords like "passionate" or "guru"
- End with what value they bring to clients
- Return ONLY the bio text, nothing else`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Log full response in terminal so we can see what's happening
    console.log("Status:", response.status);
    console.log("Full response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { bio: "", error: data.error?.message || "API error" },
        { status: 500 }
      );
    }

    const bio = data.content?.[0]?.text?.trim() || "";
    return NextResponse.json({ bio });

  } catch (err) {
    console.error("Fetch error:", err);
    return NextResponse.json({ bio: "", error: "Network error" }, { status: 500 });
  }
}
