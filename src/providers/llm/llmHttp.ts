import { ProviderError } from "@/lib/errors";
import { fetchWithTimeout, TimeoutError, withRetry } from "@/lib/retry";

export const LLM = {
  REQUEST_TIMEOUT_MS: 45_000,
  HTTP_RETRIES: 2,
  DECODE_RETRIES: 2,
  BASE_BACKOFF_MS: 500,
  TEMPERATURE: 0.4,
  MAX_TOKENS_OPENING: 256,
  MAX_TOKENS_DECIDE: 1024,
} as const;

export interface TokenUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export function logUsage(label: string, model: string, usage: TokenUsage): void {
  console.info(`[${label}] usage`, { model, ...usage });
}

class TransientHttpError extends Error {
  constructor(readonly status: number, body: string) {
    super(`Upstream ${status}: ${body.slice(0, 300)}`);
    this.name = "TransientHttpError";
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof TransientHttpError) return true;
  if (error instanceof TimeoutError) return true;
  return error instanceof TypeError;
}

export async function postJson(
  url: string,
  init: { headers: Record<string, string>; body: unknown; label: string },
): Promise<unknown> {
  return withRetry(
    async () => {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: init.headers,
        body: JSON.stringify(init.body),
        timeoutMs: LLM.REQUEST_TIMEOUT_MS,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");

        if (response.status === 429 || response.status >= 500) {
          throw new TransientHttpError(response.status, text);
        }

        throw new ProviderError(
          `${init.label} returned ${response.status}: ${text.slice(0, 300)}`,
        );
      }

      return response.json();
    },
    {
      retries: LLM.HTTP_RETRIES,
      baseDelayMs: LLM.BASE_BACKOFF_MS,
      shouldRetry: isTransient,
      onRetry: (attempt, error, delayMs) => {
        console.warn(`[${init.label}] transient failure, retry ${attempt}`, {
          delayMs,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  ).catch((error) => {
    if (error instanceof ProviderError) {
      throw error;
    }

    throw new ProviderError(
      `${init.label} failed after ${LLM.HTTP_RETRIES + 1} attempts: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  });
}
