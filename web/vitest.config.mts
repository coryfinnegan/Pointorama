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
      ADMIN_PIN_HASH: "$2b$10$.TBj13o9YwdcxU0i82mHOudNYjGTGQadvk8yV8NnmyrZSUn4plTC6",
      NEXT_PUBLIC_KID_NAME: "Sam",
    },
  },
});
