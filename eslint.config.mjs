import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // <img> comum de propósito: next/image gera outro markup (srcset) e fica
  // para o redesign. Ver docs/plano-migracao-next.md.
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ferramentas de skills (não são código do site).
    ".agents/**",
    ".claude/**",
    ".impeccable/**",
  ]),
]);

export default eslintConfig;
