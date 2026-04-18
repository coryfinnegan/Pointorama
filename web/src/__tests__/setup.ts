// Global Vitest setup — runs before every test file.
// Suppress Next.js server-only guard so route handlers can be imported in tests.
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
