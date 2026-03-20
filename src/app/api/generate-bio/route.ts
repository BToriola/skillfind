import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { name, skill, experience, strength, state } = await req.json();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Write a short, professional freelancer bio for a Nigerian professional with these details:
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
- Return ONLY the bio text, nothing else`;

    const result = await model.generateContent(prompt);
    const bio = result.response.text().trim();
    return NextResponse.json({ bio });

  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ bio: "", error: "Failed to generate bio" }, { status: 500 });
  }
}
