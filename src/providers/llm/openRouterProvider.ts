import type { Decision } from "@/domain/interview";
import type { Job } from "@/domain/session";
import { ProviderError } from "@/lib/errors";
import type { DecideInput, LlmProvider } from "./llmProvider";
import { decodeWithRepair } from "./decodeDecision";
import { LLM, logUsage, postJson } from "./llmHttp";
import {
  buildDecideMessages,
  buildOpeningMessages,
  type ChatMessage,
} from "./prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ProviderError(`${name} is not set`);
  }

  return value;
}

async function complete(
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const json = (await postJson(OPENROUTER_URL, {
    label: "OpenRouter",
    headers: {
      Authorization: `Bearer ${env("OPENROUTER_API_KEY")}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "interviewer-ai",
    },
    body: {
      model,
      temperature: LLM.TEMPERATURE,
      max_tokens: maxTokens,
      messages,
    },
  })) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  logUsage("OpenRouter", model, {
    promptTokens: json.usage?.prompt_tokens ?? null,
    completionTokens: json.usage?.completion_tokens ?? null,
    totalTokens: json.usage?.total_tokens ?? null,
  });

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError("OpenRouter returned no content");
  }

  return content;
}

export class OpenRouterProvider implements LlmProvider {
  async openingQuestion({ job }: { job: Job }): Promise<string> {
    const content = await complete(buildOpeningMessages(job), LLM.MAX_TOKENS_OPENING);
    return content.trim().replace(/^["']|["']$/g, "");
  }

  async decide(input: DecideInput): Promise<Decision> {
    const messages = buildDecideMessages(input);

    return decodeWithRepair(
      (hint) =>
        complete(
          hint ? [...messages, { role: "user", content: hint }] : messages,
          LLM.MAX_TOKENS_DECIDE,
        ),
      input.job,
      LLM.DECODE_RETRIES,
    );
  }
}

export const openRouterProvider = new OpenRouterProvider();
