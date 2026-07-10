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

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ProviderError(`${name} is not set`);
  }

  return value;
}

function toGeminiBody(
  messages: ChatMessage[],
  asJson: boolean,
  maxTokens: number,
) {
  const systemText = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const contents = messages
    .filter((message) => message.role === "user")
    .map((message) => ({ role: "user", parts: [{ text: message.content }] }));

  return {
    ...(systemText
      ? { systemInstruction: { parts: [{ text: systemText }] } }
      : {}),
    contents,
    generationConfig: {
      temperature: LLM.TEMPERATURE,
      maxOutputTokens: maxTokens,
      ...(asJson ? { responseMimeType: "application/json" } : {}),
    },
  };
}

async function complete(
  messages: ChatMessage[],
  asJson: boolean,
  maxTokens: number,
): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const json = (await postJson(`${BASE_URL}/${model}:generateContent`, {
    label: "Gemini",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env("GEMINI_API_KEY"),
    },
    body: toGeminiBody(messages, asJson, maxTokens),
  })) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  logUsage("Gemini", model, {
    promptTokens: json.usageMetadata?.promptTokenCount ?? null,
    completionTokens: json.usageMetadata?.candidatesTokenCount ?? null,
    totalTokens: json.usageMetadata?.totalTokenCount ?? null,
  });

  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");
  if (!text) {
    throw new ProviderError("Gemini returned no content");
  }

  return text;
}

export class GeminiProvider implements LlmProvider {
  async openingQuestion({ job }: { job: Job }): Promise<string> {
    const content = await complete(
      buildOpeningMessages(job),
      false,
      LLM.MAX_TOKENS_OPENING,
    );
    return content.trim().replace(/^["']|["']$/g, "");
  }

  async decide(input: DecideInput): Promise<Decision> {
    const messages = buildDecideMessages(input);

    return decodeWithRepair(
      (hint) =>
        complete(
          hint ? [...messages, { role: "user", content: hint }] : messages,
          true,
          LLM.MAX_TOKENS_DECIDE,
        ),
      input.job,
      LLM.DECODE_RETRIES,
    );
  }
}

export const geminiProvider = new GeminiProvider();
