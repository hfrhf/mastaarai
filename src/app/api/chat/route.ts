import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature, maxTokens, stream, memories } = await req.json();

    const isGoogle = model && (model.startsWith('google/') || model.startsWith('gemini-'));

    // Format memories context if available
    let memoryContext = '';
    if (memories && memories.length > 0) {
      memoryContext = `\n\n[User Profile & Saved Memories:\nThe AI assistant has stored the following permanent facts about the user. Adhere to these facts/preferences where applicable:\n${memories.map((m: string) => `- ${m}`).join('\n')}\n]`;
    }

    if (isGoogle) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY is not configured in .env.local.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Extract system instructions if present
      const systemMessage = messages.find((m: any) => m.role === 'system');
      let systemPrompt = systemMessage ? systemMessage.content : '';
      if (memoryContext) {
        systemPrompt = systemPrompt ? (systemPrompt + memoryContext) : memoryContext.trim();
      }

      // Filter out system message and format history for Gemini contents
      const filteredMessages = messages.filter((m: any) => m.role !== 'system');
      const contents = filteredMessages.map((m: any) => {
        const parts: any[] = [];
        
        // Only push text part if it is not empty to comply with Gemini API schema
        if (m.content && m.content.trim() !== '') {
          parts.push({ text: m.content });
        }
        
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach((att: any) => {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64Data
              }
            });
          });
        }
        
        // Gemini contents require at least one part
        if (parts.length === 0) {
          parts.push({ text: ' ' });
        }
        
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      const geminiBody: any = {
        contents,
        generationConfig: {
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxTokens ?? 2048
        }
      };

      if (systemPrompt) {
        geminiBody.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const isStream = stream ?? true;
      if (isStream) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`,
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
          console.error('Gemini Stream API error response:', errText);
          return new Response(
            JSON.stringify({ error: `Gemini API error: ${response.statusText}`, details: errText }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';

        const transformStream = new ReadableStream({
          async start(controller) {
            if (!reader) {
              controller.close();
              return;
            }
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  if (buffer.trim()) {
                    processLine(buffer, controller, encoder);
                  }
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  controller.close();
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  processLine(line, controller, encoder);
                }
              }
            } catch (err) {
              controller.error(err);
            }
          }
        });

        return new Response(transformStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
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
          console.error('Gemini Generate API error response:', errText);
          return new Response(
            JSON.stringify({ error: `Gemini API error: ${response.statusText}`, details: errText }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Map to OpenAI-compatible non-streaming format
        const openaiResponse = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: text
              },
              finish_reason: 'stop',
              index: 0
            }
          ]
        };

        return new Response(JSON.stringify(openaiResponse), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Default: Dahl Provider
    const apiKey = process.env.DAHL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DAHL_API_KEY is not configured in .env.local.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let mappedMessages = messages.map((m: any) => {
      if (m.attachments && m.attachments.length > 0) {
        const contentArray: any[] = [];
        
        if (m.content && m.content.trim() !== '') {
          contentArray.push({ type: 'text', text: m.content });
        }
        
        m.attachments.forEach((att: any) => {
          if (att.mimeType.startsWith('image/')) {
            contentArray.push({
              type: 'image_url',
              image_url: {
                url: `data:${att.mimeType};base64,${att.base64Data}`
              }
            });
          }
        });
        
        if (contentArray.length === 0) {
          contentArray.push({ type: 'text', text: ' ' });
        }
        
        return {
          role: m.role,
          content: contentArray,
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    if (memoryContext) {
      const sysMsgIdx = mappedMessages.findIndex((m: any) => m.role === 'system');
      if (sysMsgIdx >= 0) {
        mappedMessages[sysMsgIdx].content += memoryContext;
      } else {
        mappedMessages.unshift({ role: 'system', content: memoryContext.trim() });
      }
    }

    const body = {
      model: model || 'MiniMaxAI/MiniMax-M2.7',
      messages: mappedMessages,
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

    const isStream = stream ?? true;
    if (isStream) {
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

function processLine(line: string, controller: ReadableStreamDefaultController<any>, encoder: TextEncoder) {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (trimmed.startsWith('data: ')) {
    const jsonStr = trimmed.slice(6);
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content !== undefined) {
        const openaiChunk = {
          choices: [
            {
              delta: {
                content: content
              }
            }
          ]
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
      }
    } catch (e) {
      // Ignore partial JSON parsing errors
    }
  }
}
