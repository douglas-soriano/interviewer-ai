import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "./errors";

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
