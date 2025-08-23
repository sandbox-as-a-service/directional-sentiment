import type {Config} from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handling Absolute Imports and Module Path Aliases
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
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
