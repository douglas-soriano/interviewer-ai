export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      if (attempt === opts.retries || opts.shouldRetry?.(error) === false) {
        break;
      }

      const delayMs = Math.random() * Math.min(maxDelayMs, opts.baseDelayMs * 2 ** attempt);
      opts.onRetry?.(attempt + 1, error, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs: number },
): Promise<Response> {
  const { timeoutMs, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new TimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
