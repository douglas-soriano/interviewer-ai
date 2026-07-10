export const LOCAL_DATABASE_URL =
  "postgresql://interviewer:interviewer@localhost:5432/interviewer";

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not set.");
  }

  return LOCAL_DATABASE_URL;
}
