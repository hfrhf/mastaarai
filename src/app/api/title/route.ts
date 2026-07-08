import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DAHL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DAHL_API_KEY is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, model } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemInstruction = 
      "You are a helpful assistant. Your task is to generate an extremely short, professional title for a chat conversation based on the user's first message. The title MUST be less than 5 words. Do not use quotes, punctuation, or any introductory phrases (e.g. do not write 'Title: ...'). Just output the title.";

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
