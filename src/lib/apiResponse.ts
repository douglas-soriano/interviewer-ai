import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "./errors";

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return String(error);
}

function isDatabaseUnavailable(error: unknown): boolean {
  const code = getErrorCode(error)?.toLowerCase() ?? "";
  const message = getErrorMessage(error).toLowerCase();

  if (
    code === "econnrefused" ||
    code === "enotfound" ||
    code === "57p01" ||
    code === "57p03"
  ) {
    return true;
  }

  return (
    message.includes("database_url is not set") ||
    message.includes("connect econnrefused") ||
    message.includes("connection refused") ||
    message.includes("failed to connect") ||
    (message.includes("postgres") && message.includes("connect")) ||
    (message.includes("database") && message.includes("unavailable"))
  );
}

export const apiResponse = {
  success<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  },

  list<T>(data: T[], total?: number) {
    return NextResponse.json({
      success: true,
      data,
      meta: { total: total ?? data.length },
    });
  },

  error(error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues.map((issue) => issue.message).join("; "),
          code: "validation_error",
        },
        { status: 400 },
      );
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database is unavailable. Start Postgres or check DATABASE_URL.",
          code: "database_unavailable",
        },
        { status: 503 },
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    console.error("[apiResponse] unhandled error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        code: "internal",
      },
      { status: 500 },
    );
  },
};
