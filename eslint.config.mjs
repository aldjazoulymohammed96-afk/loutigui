import nextConfig from "eslint-config-next";

/**
 * Next 16 ships native flat config; no eslintrc compatibility layer needed.
 * The three React Compiler rules below are new opinionated checks. They are
 * downgraded while the affected components are migrated progressively; the
 * security and correctness rules from next/core-web-vitals stay enforced.
 */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig.map((config, index) =>
    index === 0
      ? {
          ...config,
          rules: {
            ...config.rules,
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/immutability": "off",
            "react-hooks/refs": "off",
          },
        }
      : index === 1
        ? {
            ...config,
            rules: {
              ...config.rules,
              "@typescript-eslint/no-explicit-any": "warn",
            },
          }
        : config
  ),
];

export default eslintConfig;
