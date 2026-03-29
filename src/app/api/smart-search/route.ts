import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are a search assistant for SkillFind, a Nigerian freelancer directory. 
When given a natural language query, extract the most relevant search keyword and category.
Always respond in valid JSON only with this exact format:
{"keyword": "search term", "category": "category name or All"}
Available categories: Technology, Design, Writing, Marketing, Trades, Photography, Education, Other, All`,
          },
          {
            role: "user",
            content: `Extract search intent from this query: "${query}"`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { keyword: query, category: "All", error: data.error?.message },
        { status: 500 }
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json({
      keyword: parsed.keyword || query,
      category: parsed.category || "All",
    });

  } catch (err) {
    console.error("Groq smart search error:", err);
    return NextResponse.json({ keyword: query, category: "All" });
  }
}
