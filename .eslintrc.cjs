module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Next.js now auto-imports React—you can turn off the old “must import React” rule:
    "react/react-in-jsx-scope": "off",
    // If you’re on TypeScript you don’t need prop-types:
    "react/prop-types": "off",
    // These you can soften to warnings instead of errors:
    "@typescript-eslint/no-unused-expressions": "warn",
    "no-async-promise-executor": "warn"
  }
};
