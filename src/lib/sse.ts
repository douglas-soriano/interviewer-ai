export type SseEvent =
  | { type: "token"; value: string }
  | { type: "done"; payload: unknown }
  | { type: "error"; message: string };

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export const SSE_TYPING_DELAY_MS = 12;

export function sseChunk(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function chunkText(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}
