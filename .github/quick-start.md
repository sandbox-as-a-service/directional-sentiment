# Quick Start for New Developers

Welcome to the Directional Sentiment project! This guide will get you up and running quickly.

## Prerequisites

- **Node.js 18+** with npm
- **Git** for version control
- **Code Editor** (VS Code recommended for REST Client extension)

## Initial Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd directional-sentiment
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# See environment-setup.md for detailed configuration
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Commands

```bash
npm run dev            # Development server with Turbopack
npm run build          # Production build
npm run test:unit:jest # Run unit tests
npm run lint           # ESLint check
npm run format         # Prettier formatting
```

## Architecture Overview

This project uses **hexagonal architecture** with clear separation:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
├── (adapters)/        # Infrastructure implementations
├── _infra/            # Cross-cutting concerns
└── (public)/          # UI pages and components
```

## First Steps to Read

1. **[Architecture Guidelines](.github/architecture.md)** - Understand the hexagonal pattern
2. **[Development Workflow](.github/development.md)** - Commands and testing setup
3. **Domain Use Cases**: Start with `src/app/_domain/use-cases/polls/`
4. **API Routes**: Check `src/app/(adapters)/(in)/api/polls/`

## Common Development Tasks

For step-by-step guides on common tasks, see **[Task Examples](./task-examples.md)**:

- Adding a new use case
- Adding a data source
- Writing unit tests
- API endpoint development

## Need Help?

- **Environment Issues**: See [Environment Setup](./environment-setup.md)
- **Common Errors**: See [Troubleshooting](./troubleshooting.md)
- **Testing Patterns**: See [Testing Guidelines](./testing.md)
- **Architecture Questions**: See [Architecture Guidelines](./architecture.md)

## Project Structure Quick Reference

```
.github/               # Documentation and workflows
├── architecture.md    # Hexagonal architecture patterns
├── development.md     # Commands and workflows
├── testing.md         # Unit testing methodology
├── conventions.md     # Code style and naming
├── tech-stack.md      # Dependencies and frameworks
├── database.md        # Database schema and usage
└── sequence-diagrams/ # API flow documentation

src/app/
├── _domain/           # Pure domain logic
│   ├── ports/         # Interface contracts
│   └── use-cases/     # Domain logic implementation
├── (adapters)/        # Infrastructure implementations
│   ├── (in)/          # API routes and Server Actions
│   └── (out)/         # Database and external service adapters
├── _infra/            # Cross-cutting concerns (middleware)
└── (public)/          # UI pages and components

rest-client/           # API testing with REST Client extension
```

## Development Workflow

1. **Read existing code** in `_domain/use-cases/polls/` to understand patterns
2. **Follow TDD** - write tests in `__tests__/` folders first
3. **Use adapters** - never import from infrastructure in domain code
4. **Check sequence diagrams** for understanding API flows
5. **Test with REST Client** - use files in `rest-client/` directory

Ready to contribute? Check out the [Task Examples](./task-examples.md) for your first development task!