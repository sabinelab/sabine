import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/src/schemas/",
  datasource: {
    url: env("DATABASE_URL")
  }
});
