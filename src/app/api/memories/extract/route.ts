import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ memories: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are an AI memory extraction system. Your task is to analyze the user's message and extract permanent facts, preferences, or details about the user themselves (e.g. name, location, preferred programming languages, framework choice, hobbies).
Ignore temporary actions, standard questions, or statements not related to user characteristics.

CRITICAL RULE: The extracted facts in the output JSON array MUST be written in the exact same language that the user spoke in.
- If the user writes in Arabic, the extracted fact MUST be in Arabic.
- If the user writes in English, the extracted fact MUST be in English.
- If the user writes in French, the extracted fact MUST be in French.

Return the extracted facts as a valid JSON array of strings. If no permanent facts are mentioned, return an empty JSON array: [].

Example 1 (English):
Input: "Hi, my name is Alex and I build Next.js applications."
Output: ["Alex is the user's name", "Alex builds Next.js applications"]

Example 2 (Arabic):
Input: "مرحباً، اسمي أحمد وأنا مطور تطبيقات ويب بلغة بايثون"
Output: ["أحمد هو اسم المستخدم", "المستخدم مطور تطبيقات ويب بلغة بايثون"]

Example 3 (English):
Input: "Can you write a loop in Python?"
Output: []`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { role: 'user', parts: [{ text: message }] }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini memory extraction error:', errText);
      return new Response(JSON.stringify({ error: 'Gemini API failed', details: errText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';
    
    let memories = [];
    try {
      memories = JSON.parse(text);
      if (!Array.isArray(memories)) {
        memories = [];
      }
    } catch (e) {
      memories = [];
    }

    return new Response(JSON.stringify({ memories }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Memory extraction exception:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
