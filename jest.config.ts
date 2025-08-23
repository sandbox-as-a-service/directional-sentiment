import type {Config} from "jest"
import nextJest from "next/jest.js"

// Load Next config + .env so your domain can read env vars if needed
const createJestConfig = nextJest({dir: "./"})

const config: Config = {
  // ---- Scope: Node-only domain tests ----
  testEnvironment: "node",
  roots: ["<rootDir>/src"],

  // Only pick up *.test.ts in your domain area
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts", "<rootDir>/src/**/?(*.)test.ts"],

  // Helpful hygiene
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 5000,

  // Path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  collectCoverage: false, // default off; enable via CLI
  // Coverage (tune to taste)
  collectCoverageFrom: [
    "src/app/_domain/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/*.{spec,test}.{ts,tsx}",
    "!src/**/dto/**",
    "!src/**/ports/**", // ⬅ exclude hex ports (types/interfaces)
    "!src/**/types/**", // optional
    "!src/**/*.d.ts", // .d.ts files
    "!src/**/index.{ts,tsx}", // optional: barrel files
  ],
  coverageProvider: "v8",
  coverageReporters: ["text", "lcov"],

  // Keep CI deterministic without grinding to a halt // or process.env.CI ? 2 : "75%"
  maxWorkers: process.env.CI ? "50%" : "75%", // or process.env.CI ? 2 : "75%"

  // Keep noise down
  verbose: false,

  // If you later add a jsdom project, we’ll switch to a multi-project config
}

export default createJestConfig(config)

//Under the hood, next/jest is automatically configuring Jest for you, including:

// Setting up transform using the Next.js Compiler.
// Auto mocking stylesheets (.css, .module.css, and their scss variants), image imports and next/font.
// Loading .env (and all variants) into process.env.
// Ignoring node_modules from test resolving and transforms.
// Ignoring .next from test resolving.
// Loading next.config.js for flags that enable SWC transforms.

// Good to know: To test environment variables directly,
// load them manually in a separate setup script or in your jest.config.ts file. For more information, please see Test Environment Variables.
