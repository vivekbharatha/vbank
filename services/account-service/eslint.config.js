module.exports = {
  "env": {
    "browser": false,
    "node": true,
    "es2021": true
  },
  "files": ["./src/**/*.ts"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "no-console": "warn"
  }
}
