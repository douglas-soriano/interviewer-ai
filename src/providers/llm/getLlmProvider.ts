import { ProviderError } from "@/lib/errors";
import type { LlmProvider } from "./llmProvider";
import { geminiProvider } from "./geminiProvider";
import { openRouterProvider } from "./openRouterProvider";

export type LlmProviderName = "openrouter" | "gemini";

const registry: Record<LlmProviderName, LlmProvider> = {
  openrouter: openRouterProvider,
  gemini: geminiProvider,
};

export function getLlmProvider(): LlmProvider {
  const name = (process.env.LLM_PROVIDER ?? "openrouter") as LlmProviderName;
  const provider = registry[name];

  if (!provider) {
    throw new ProviderError(
      `Unknown LLM_PROVIDER "${name}". Valid: ${Object.keys(registry).join(", ")}`,
    );
  }

  return provider;
}
