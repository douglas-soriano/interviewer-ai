export interface ApiFailure {
  code?: string;
  message?: string;
}

type ErrorContext = "start" | "submit";

function isMissingKeyMessage(message: string): boolean {
  return /(?:api_key|key|provider).*not set/i.test(message);
}

export function getUiErrorMessage(
  failure: ApiFailure,
  context: ErrorContext,
): string {
  const message = failure.message ?? "";

  if (failure.code === "database_unavailable") {
    return context === "start"
      ? "The interview service could not reach the database. Start Postgres or check DATABASE_URL."
      : "The interview service could not reach the database. Retry this answer after the service recovers.";
  }

  if (failure.code === "provider_error" && isMissingKeyMessage(message)) {
    return context === "start"
      ? "The selected LLM provider is missing its API key. Add the key and start the interview again."
      : "The selected LLM provider is missing its API key. Update the server settings, then retry this answer.";
  }

  if (failure.code === "provider_error") {
    return context === "start"
      ? "The interview provider is unavailable right now. Try again in a moment."
      : "The interview provider is unavailable right now. Retry this answer in a moment.";
  }

  if (failure.code === "internal") {
    return context === "start"
      ? "The interview service is unavailable right now. Check the server and try again."
      : "The interview service failed while processing this answer. Retry this answer.";
  }

  return failure.message ?? "Unexpected request failure.";
}
