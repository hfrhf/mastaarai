/**
 * Parses Server-Sent Events (SSE) stream chunks.
 * Handles split chunks and extracts content deltas.
 */
export function parseSSEChunk(
  chunk: string,
  onDelta: (delta: string) => void,
  onDone?: () => void
) {
  const lines = chunk.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed === 'data: [DONE]') {
      if (onDone) onDone();
      continue;
    }
    
    if (trimmed.startsWith('data: ')) {
      const jsonStr = trimmed.slice(6);
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) {
          onDelta(delta);
        }
      } catch (e) {
        // Log parse failure silently, could be partial JSON in chunking
        console.debug('Failed to parse SSE JSON line:', trimmed, e);
      }
    }
  }
}
