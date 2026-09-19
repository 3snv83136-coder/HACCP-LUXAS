import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url.startsWith("postgres")) {
  console.error("DATABASE_URL Postgres est requis pour le build (Supabase/Neon).");
  process.exit(1);
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
run("npx", ["prisma", "db", "push"]);
run("npx", ["prisma", "db", "seed"]);
run("npx", ["next", "build"]);
