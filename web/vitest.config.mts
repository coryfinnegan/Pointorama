import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    pool: "forks", // required for better-sqlite3 native module
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      SESSION_SECRET: "test-secret-key-padded-to-32-bytes!!!!",
      ADMIN_PIN_HASH: "JDJiJDEwJFVOTmpNeWJ4Mjc5cXJHb3hSNzY3UC5jV1N1d0JLcGEzSVRpMEZ0SENWbnk3S2N0dVlkZU55",
      NEXT_PUBLIC_KID_NAME: "Sam",
    },
  },
});
