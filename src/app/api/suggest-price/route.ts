import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { skill, category, experience, state } = await req.json();

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
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Suggest a fair freelance rate for a Nigerian professional with these details:
- Skill/Role: ${skill}
- Category: ${category}
- Years of Experience: ${experience}
- State: ${state}, Nigeria

Give a realistic rate range in Nigerian Naira. Format as:
Hourly: ₦X,000 - ₦Y,000/hr
Per Project: ₦X,000 - ₦Y,000/project

Return ONLY the two lines above, nothing else.`,
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
        { suggestion: "", error: data.error?.message || "API error" },
        { status: 500 }
      );
    }

    const suggestion = data.content?.[0]?.text?.trim() || "";
    return NextResponse.json({ suggestion });

  } catch (err) {
    console.error("Fetch error:", err);
    return NextResponse.json({ suggestion: "", error: "Network error" }, { status: 500 });
  }
}
