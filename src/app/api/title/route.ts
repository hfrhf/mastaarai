import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemInstruction = 
      "You are a professional assistant. Generate an extremely short, clear, and professional title (maximum 3-4 words) for the chat conversation based on the user's message. " +
      "The title MUST be in the same language as the user's message (e.g., if the user writes in Arabic, the title MUST be in Arabic). " +
      "Do NOT use quotes, do NOT use punctuation, do NOT use introductory phrases, and do NOT include any markdown or code blocks. Just output the clean title text directly.";

    const isGoogle = model && (model.startsWith('google/') || model.startsWith('gemini-'));

    if (isGoogle) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const geminiBody = {
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { role: 'user', parts: [{ text: `Generate a title for: "${prompt}"` }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 30
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiBody),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini Title API error response:', errText);
        return new Response(
          JSON.stringify({ error: `Gemini API error: ${response.statusText}`, details: errText }),
          { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const json = await response.json();
      let title = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'New Chat';
      
      // Strip surrounding quotes if any
      title = title.replace(/^["']|["']$/g, '');

      return new Response(JSON.stringify({ title }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default: Dahl Provider
    const apiKey = process.env.DAHL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DAHL_API_KEY is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = {
      model: model || 'MiniMaxAI/MiniMax-M2.7',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Generate a title for: "${prompt}"` },
      ],
      temperature: 0.3,
      max_tokens: 30,
      stream: false,
    };

    const response = await fetch('https://inference.dahl.global/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Dahl Title API error response:', errText);
      return new Response(
        JSON.stringify({ error: `Dahl API error: ${response.statusText}`, details: errText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const json = await response.json();
    let title = json?.choices?.[0]?.message?.content?.trim() || 'New Chat';
    
    // Strip surrounding quotes if any
    title = title.replace(/^["']|["']$/g, '');

    return new Response(JSON.stringify({ title }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Proxy title generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate title', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
