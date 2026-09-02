/** @type {import('prettier').Config} */

module.exports = {
  plugins: [
    "prettier-plugin-css-order",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-organize-imports",
    "prettier-plugin-packagejson",
  ],
  endOfLine: "lf",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: false,
  trailingComma: "es5",
  quoteProps: "as-needed",
  bracketSpacing: true,
  arrowParens: "always",
}
