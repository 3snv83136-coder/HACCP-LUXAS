import { spawnSync } from "node:child_process";

const BUILD_PLACEHOLDER = "postgresql://build:build@127.0.0.1:5432/build";

const raw = process.env.DATABASE_URL?.trim() ?? "";
const isPostgres = raw.startsWith("postgres");

if (!isPostgres) {
  process.env.DATABASE_URL = BUILD_PLACEHOLDER;
  console.warn(
    "DATABASE_URL Postgres absent au build : prisma generate + next build seulement.",
  );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);
if (isPostgres) {
  run("npx", ["prisma", "db", "push"]);
  run("npx", ["prisma", "db", "seed"]);
}
run("npx", ["next", "build"]);
