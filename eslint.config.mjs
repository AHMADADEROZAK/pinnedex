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
    // Aset tooling & agent — bukan kode aplikasi.
    ".agents/**",
    ".opencode/**",
  ]),
  {
    // Gambar remote dinamis (logo token pihak ketiga & upload user):
    // host tidak bisa di-whitelist statis untuk next/image.
    files: [
      "app/community/**/*.tsx",
      "features/community/components/**/*.tsx",
      "features/news/components/**/*.tsx",
      "features/signal/components/**/*.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
