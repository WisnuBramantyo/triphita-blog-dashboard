import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL?.trim();

function mysqlUrlFromEnv(): string {
  const rawHost = process.env.DB_HOST?.trim() || "localhost";
  const host = rawHost === "localhost" ? "127.0.0.1" : rawHost;
  const port = Number(process.env.DB_PORT) || 3306;
  const user = encodeURIComponent(process.env.DB_USER?.trim() || "root");
  const database = encodeURIComponent(
    process.env.DB_NAME?.trim() || "triphita_blog",
  );
  const rawPassword = process.env.DB_PASSWORD ?? "";
  const password =
    rawPassword.length > 0
      ? `:${encodeURIComponent(rawPassword)}@`
      : "@";
  return `mysql://${user}${password}${host}:${port}/${database}`;
}

const url =
  databaseUrl?.startsWith("mysql://") || databaseUrl?.startsWith("mysql2://")
    ? databaseUrl
    : mysqlUrlFromEnv();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: { url },
});
