import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./databaseUrl";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;
type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  postgresClient?: PostgresClient;
  drizzleDb?: Db;
};

function createDb(): Db {
  const connectionString = getDatabaseUrl();
  const client =
    globalForDb.postgresClient ?? postgres(connectionString, { prepare: false });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgresClient = client;
  }

  return drizzle(client, { schema });
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    globalForDb.drizzleDb ??= createDb();
    return Reflect.get(globalForDb.drizzleDb, prop, receiver);
  },
});
