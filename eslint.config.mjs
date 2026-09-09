import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // next.js-generated, not hand-written
    "types/routes.d.ts",
    "types/validator.ts",
    "types/cache-life.d.ts",
    // vinext/Vite's build output (see `npm run build:vinext`) — not
    // hand-written, and gitignored already, but not caught by any of
    // eslint-config-next's own defaults above since those predate the
    // Cloudflare deploy setup.
    "dist/**",
  ]),
]);

export default eslintConfig;
