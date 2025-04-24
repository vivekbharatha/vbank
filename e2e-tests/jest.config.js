/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/master.test.ts"],
  testTimeout: 15000,
  verbose: true,
};
