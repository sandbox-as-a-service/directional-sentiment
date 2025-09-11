# Tech Stack & Dependencies

## Core Framework

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **Package Manager**: pnpm (specified in packageManager field)
- **Runtime**: Node.js 22 with React 19

## Database & Validation

- **Database**: Supabase with `@supabase/supabase-js` v2.55+
- **Validation**: Zod v4+ for runtime type checking
- **SSR**: `@supabase/ssr` for server-side rendering

## Styling & UI

- **Styling**: Tailwind CSS v4
- **PostCSS**: `@tailwindcss/postcss` for processing
- **UI Library**: React 19 with built-in components

## Development Tools

### Linting & Formatting

- **ESLint**: v9 with Next.js config and Prettier integration
  - `@next/eslint-plugin-next`: v15.5+ for Next.js specific rules
  - `eslint-config-next`: v15.5+ for Next.js ESLint configuration
  - `eslint-config-prettier`: v10.1+ for Prettier integration
  - `eslint-plugin-react-hooks`: v5.2+ for React Hooks rules
  - `@eslint/eslintrc`: v3.3+ for legacy config support
- **Prettier**: v3.6+ with Tailwind plugin and import sorting
- **Import Sorting**: `@trivago/prettier-plugin-sort-imports` v5.2+

### Testing

- **Unit Testing**: Jest v30 with Next.js helpers (`next/jest`) for ts-node, environment variables, and module mapping
  - `@jest/globals`: v30+ for Jest globals in TypeScript

### TypeScript & Development

- **TypeScript**: v5.9+ with strict type checking
- **Type Definitions**:
  - `@types/node`: v24.3+ for Node.js types
  - `@types/react`: v19.1+ for React types
  - `@types/react-dom`: v19.1+ for React DOM types
