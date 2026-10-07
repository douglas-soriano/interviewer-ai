import { ProviderError } from "@/lib/errors";
import { LLM, postJson } from "@/providers/llm/llmHttp";
import {
  JudgeConversationEvaluationSchema,
  type ConversationEvalCase,
  type JudgeConversationEvaluation,
} from "./conversationEval";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new ProviderError(`${name} is not set`);
  return value;
}

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "")
    .trim();
}

function formatConversation(testCase: ConversationEvalCase): string {
  return testCase.conversation
    .map(
      (turn, index) =>
        `Q${index + 1}: ${turn.question}\nA${index + 1}: ${turn.answer}`,
    )
    .join("\n\n");
}

function calibrationBlock(calibrationCases: ConversationEvalCase[]): string {
  if (calibrationCases.length === 0) {
    return "No calibration examples were supplied.";
  }

  return calibrationCases
    .slice(0, 4)
    .map(
      (testCase, index) => `Calibration example ${index + 1}
Role: ${testCase.role}
Conversation:
${formatConversation(testCase)}
Human labels:
${JSON.stringify(testCase.human)}`,
    )
    .join("\n\n---\n\n");
}

function buildPrompt(
  testCase: ConversationEvalCase,
  calibrationCases: ConversationEvalCase[],
): { system: string; user: string } {
  const system = `You are an evaluator for a structured conversational interview agent.
Judge the conversation, not the candidate. Use the human-labeled calibration examples to align your scale.

Score each dimension from 1 to 5:
- relevance: questions stay aligned to the role and prior answer.
- followUpQuality: follow-ups probe concrete claims instead of repeating or changing topics arbitrarily.
- evidenceGrounding: conclusions and scoring are supported by evidence in candidate answers.
- coherence: the interview maintains state, avoids contradictions, and progresses naturally.

Pass only when the conversation is acceptable for a production interview workflow.
Return JSON only with this exact shape:
{
  "relevance": 1,
  "followUpQuality": 1,
  "evidenceGrounding": 1,
  "coherence": 1,
  "pass": false,
  "rationale": ["short reason"]
}`;

  const user = `${calibrationBlock(calibrationCases)}

Evaluate this regression case.
Role: ${testCase.role}
Conversation:
${formatConversation(testCase)}

Human labels are intentionally hidden for this case. Return only the JSON evaluation.`;

  return { system, user };
}

async function completeGemini(system: string, user: string): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const json = (await postJson(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    label: "Gemini Eval Judge",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env("GEMINI_API_KEY"),
    },
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 768,
        responseMimeType: "application/json",
      },
    },
  })) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");

  if (!text) throw new ProviderError("Gemini eval judge returned no content");
  return text;
}

async function completeOpenRouter(
  system: string,
  user: string,
): Promise<string> {
  const model =
    process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";

  const json = (await postJson(OPENROUTER_URL, {
    label: "OpenRouter Eval Judge",
    headers: {
      Authorization: `Bearer ${env("OPENROUTER_API_KEY")}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "interviewer-ai-evals",
    },
    body: {
      model,
      temperature: 0,
      max_tokens: 768,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
  })) as { choices?: { message?: { content?: string } }[] };

  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError("OpenRouter eval judge returned no content");
  return text;
}

export async function judgeConversation(
  testCase: ConversationEvalCase,
  calibrationCases: ConversationEvalCase[],
): Promise<JudgeConversationEvaluation> {
  const { system, user } = buildPrompt(testCase, calibrationCases);
  const provider = (process.env.EVAL_LLM_PROVIDER ??
    process.env.LLM_PROVIDER ??
    "gemini") as "gemini" | "openrouter";

  const content =
    provider === "gemini"
      ? await completeGemini(system, user)
      : provider === "openrouter"
        ? await completeOpenRouter(system, user)
        : (() => {
            throw new ProviderError(
              `Unknown EVAL_LLM_PROVIDER "${provider}". Valid: gemini, openrouter`,
            );
          })();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    throw new ProviderError(
      `Eval judge returned invalid JSON: ${content.slice(0, 300)}`,
    );
  }

  return JudgeConversationEvaluationSchema.parse(parsed);
}
