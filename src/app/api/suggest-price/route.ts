import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { skill, category, experience, state } = await req.json();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Suggest a fair freelance rate for a Nigerian professional with these details:
- Skill/Role: ${skill}
- Category: ${category}
- Years of Experience: ${experience}
- State: ${state}, Nigeria

Rules:
- Give a realistic range in Nigerian Naira (₦)
- Consider the Nigerian market, not western rates
- Format your response exactly like this:
Hourly: ₦X,000 - ₦Y,000/hr
Per Project: ₦X,000 - ₦Y,000/project
- Return ONLY those two lines, nothing else`;

    const result = await model.generateContent(prompt);
    const suggestion = result.response.text().trim();
    return NextResponse.json({ suggestion });

  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json({ suggestion: "", error: "Failed to get suggestion" }, { status: 500 });
  }
}
