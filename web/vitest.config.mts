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
      ADMIN_PIN_HASH: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      NEXT_PUBLIC_KID_NAME: "Sam",
    },
  },
});
