import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DAHL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DAHL_API_KEY is not configured in .env.local.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model, temperature, maxTokens, stream } = await req.json();

    const body = {
      model: model || 'MiniMaxAI/MiniMax-M2.7',
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 2048,
      stream: stream ?? true,
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
      console.error('Dahl API error response:', errText);
      return new Response(
        JSON.stringify({ error: `Dahl API error: ${response.statusText}`, details: errText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const json = await response.json();
      return new Response(JSON.stringify(json), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Proxy completion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to communicate with proxy endpoint', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
