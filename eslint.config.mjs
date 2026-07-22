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
    // netlify-cliのローカル実行が生成する成果物
    ".netlify/**",
    // 毎朝ルーティンのツール群（Node/execサンドボックス用でrequire必須・アプリコードではない）
    "scripts/**",
  ]),
]);

export default eslintConfig;
