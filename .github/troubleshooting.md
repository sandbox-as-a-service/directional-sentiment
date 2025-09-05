# Troubleshooting Guide

Common errors, solutions, and known gotchas for the Directional Sentiment project.

## Build & Development Issues

### Package Manager Issues

#### "pnpm: command not found"
**Symptoms**: Build fails with pnpm not found
**Solution**: Use npm instead. The project works with both package managers:
```bash
npm install     # Instead of pnpm install
npm run dev     # Instead of pnpm dev
npm run build   # Instead of pnpm build
```

#### Dependency Resolution Errors
**Symptoms**: Package conflicts during install
**Solutions**:
```bash
# Clear package manager cache
rm -rf node_modules package-lock.json
npm install

# Or force clean install
npm ci
```

### Next.js Build Issues

#### TypeScript Compilation Errors
**Symptoms**: `Type 'X' is not assignable to type 'Y'`
**Solutions**:
1. Regenerate Supabase types:
   ```bash
   npm run supabase:typegen
   ```
2. Check domain type consistency:
   ```bash
   npm run build  # Shows all type errors
   ```
3. Verify port interface implementations match exactly

#### Turbopack Development Errors
**Symptoms**: Hot reload not working, strange build behavior
**Solutions**:
```bash
# Restart dev server
npm run dev

# Use regular webpack if Turbopack issues persist
npx next dev  # Without --turbopack flag
```

### Environment Configuration Errors

#### Missing Environment Variables
**Error**: `Environment variable NEXT_PUBLIC_SUPABASE_URL is required`
**Solutions**:
1. Check `.env.local` exists in project root
2. Verify all required variables are set:
   ```bash
   # .env.local must contain:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Restart development server after changes

#### Invalid Supabase Configuration
**Error**: `Invalid URL format` or `API key validation failed`
**Solutions**:
1. Copy keys exactly from Supabase dashboard (no extra spaces)
2. Ensure URL format: `https://project-id.supabase.co`
3. Verify project is active (not paused) in Supabase dashboard

---

## Supabase & Database Issues

### Connection Problems

#### "Failed to fetch" or Network Errors
**Symptoms**: API calls fail, can't connect to Supabase
**Solutions**:
1. Check internet connection
2. Verify Supabase project status in dashboard
3. Test connection directly:
   ```bash
   curl https://your-project.supabase.co/rest/v1/polls
   ```
4. Check for firewall/proxy blocking Supabase domains

#### Row Level Security (RLS) Violations
**Error**: `new row violates row-level security policy`
**Symptoms**: API calls return 401/403, data operations fail
**Solutions**:
1. Check RLS policies in Supabase dashboard:
   - SQL Editor → Run: `SELECT * FROM pg_policies;`
2. Verify user authentication:
   ```typescript
   // In browser console
   const { data: user } = await supabase.auth.getUser()
   console.log(user)
   ```
3. Common policy fixes:
   ```sql
   -- Allow public read access
   CREATE POLICY "Public read" ON polls FOR SELECT USING (true);
   
   -- Allow authenticated users to vote
   CREATE POLICY "Authenticated votes" ON votes 
     FOR INSERT WITH CHECK (auth.uid()::text = user_id);
   ```

### Authentication Issues

#### Session Cookie Problems
**Symptoms**: User appears logged out after refresh, inconsistent auth state
**Solutions**:
1. Check middleware cookie handling:
   ```typescript
   // Verify middleware.ts is properly configured
   // Check withSupabase middleware implementation
   ```
2. Clear browser cookies and localStorage
3. Restart development server

#### Auth Token Expired
**Error**: `JWT expired` or `Invalid token`
**Solutions**:
1. Refresh the page (auto-refresh should handle this)
2. Clear Supabase session:
   ```typescript
   await supabase.auth.signOut()
   ```
3. Check token expiration settings in Supabase dashboard

---

## Testing Issues

### Jest Configuration Problems

#### "Cannot find module" Errors
**Symptoms**: Jest can't resolve imports, Next.js components fail
**Solution**: Verify Jest configuration in `jest.config.ts`:
```typescript
// Should extend next/jest for proper path resolution
const nextJest = require('next/jest')
```

#### Test Database Issues
**Symptoms**: Tests fail due to missing test data, database state issues
**Solutions**:
1. Use in-memory fakes instead of real database:
   ```typescript
   // Use makePollsSource() helpers in __tests__/shared-helpers.ts
   const pollsSource = makePollsSource([/* test data */])
   ```
2. Keep tests isolated - don't depend on external state
3. Mock at port boundaries, not implementation details

### Test Data and Mocking

#### Flaky Tests Due to Timing
**Symptoms**: Tests pass/fail inconsistently, timing-related issues
**Solutions**:
1. Use deterministic test data:
   ```typescript
   // ✅ Fixed timestamps
   const createdAt = "2024-01-01T00:00:00Z"
   
   // ❌ Dynamic timestamps 
   const createdAt = new Date().toISOString()
   ```
2. Avoid `setTimeout` in tests
3. Mock time-dependent functions

---

## API & Route Issues

### 404 Not Found Errors

#### Route File Not Found
**Symptoms**: API calls return 404, route appears correct
**Solutions**:
1. Check file structure matches Next.js conventions:
   ```
   src/app/(adapters)/(in)/api/polls/[slug]/route.ts  ✅
   src/app/api/polls/[slug]/route.ts                  ❌ (wrong location)
   ```
2. Verify export names:
   ```typescript
   export async function GET() { /* ... */ }  ✅
   export function get() { /* ... */ }        ❌ (wrong case)
   ```
3. Restart development server after creating new routes

#### Dynamic Route Issues
**Symptoms**: `[slug]` routes not working, params undefined
**Solutions**:
1. Use await for params in App Router:
   ```typescript
   // ✅ Correct for Next.js 15
   const params = await context.params
   
   // ❌ Old pattern
   const { slug } = context.params
   ```
2. Check route file naming: `[slug]` not `{slug}`

### Data Validation Errors

#### Zod Validation Failures
**Error**: `Invalid input: Expected string, received undefined`
**Solutions**:
1. Check request structure matches schema:
   ```typescript
   // Schema expects this structure
   const BodySchema = z.object({
     optionId: z.string()
   })
   
   // Ensure request body has correct shape
   POST /api/polls/slug/votes
   { "optionId": "red" }  ✅
   { "option": "red" }    ❌ (wrong field name)
   ```
2. Use proper content-type headers:
   ```http
   Content-Type: application/json
   ```

#### Domain Error Mapping
**Symptoms**: Internal server errors for expected failures
**Solutions**:
1. Map domain errors to HTTP status codes:
   ```typescript
   if (message === "not_found") {
     return NextResponse.json({message}, {status: 404})
   }
   if (message === "poll_closed") {
     return NextResponse.json({message}, {status: 409})
   }
   ```
2. Check use case error messages match adapter expectations

---

## Performance Issues

### Slow Database Queries

#### Missing Database Indexes
**Symptoms**: Queries taking longer than expected
**Solutions**:
1. Add indexes for frequently queried fields:
   ```sql
   CREATE INDEX idx_polls_slug ON polls(slug);
   CREATE INDEX idx_votes_poll_id ON votes(poll_id);
   ```
2. Check query performance in Supabase dashboard
3. Use `EXPLAIN ANALYZE` to understand query plans

#### N+1 Query Problems
**Symptoms**: Many database calls for single operation
**Solutions**:
1. Use joins instead of multiple queries:
   ```sql
   -- ✅ Single query with join
   SELECT p.*, v.option_id, COUNT(*) 
   FROM polls p 
   LEFT JOIN votes v ON p.id = v.poll_id 
   GROUP BY p.id, v.option_id
   
   -- ❌ Multiple queries
   SELECT * FROM polls WHERE slug = ?
   SELECT * FROM votes WHERE poll_id = ?
   ```
2. Batch operations when possible

---

## Development Workflow Issues

### Git and Version Control

#### Merge Conflicts in Package Files
**Symptoms**: Conflicts in `package-lock.json` or `pnpm-lock.yaml`
**Solutions**:
```bash
# Delete lock file and reinstall
rm package-lock.json
npm install

# Commit the new lock file
git add package-lock.json
git commit -m "fix: resolve package lock conflicts"
```

#### Accidentally Committed Secrets
**Symptoms**: Environment variables committed to git
**Solutions**:
1. Immediately rotate all exposed credentials
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.local' \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Update `.gitignore` to prevent future commits

### Code Style and Linting

#### ESLint Errors Blocking Build
**Symptoms**: Build fails with linting errors
**Solutions**:
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check specific files
npx eslint src/app/specific-file.ts

# Temporarily skip linting (not recommended)
npm run build -- --no-lint
```

#### Prettier Formatting Conflicts
**Symptoms**: Code gets reformatted unexpectedly
**Solutions**:
1. Check `.prettierrc` configuration
2. Ensure consistent formatting:
   ```bash
   npm run format
   ```
3. Configure editor to use project Prettier settings

---

## Known Gotchas

### Next.js App Router Specifics

1. **Server Components**: Can't use `useState`, `useEffect`
2. **Route Handlers**: Must return `Response` objects
3. **Middleware**: Runs on Edge Runtime (limited Node.js APIs)
4. **Dynamic Routes**: Use `await context.params` in App Router

### Supabase Specifics

1. **RLS Policies**: Required for security, but can block operations
2. **JWT Tokens**: Expire regularly, auto-refresh needed
3. **Type Generation**: Must regenerate after schema changes
4. **Anonymous vs Authenticated**: Different access patterns

### TypeScript Gotchas

1. **Domain Types**: Never import from adapters in domain layer
2. **Zod Schemas**: Validation happens at runtime, not compile time
3. **Port Interfaces**: Must match exactly across implementations
4. **Error Types**: Domain errors are strings, not Error objects

## Getting Additional Help

If you're still stuck after trying these solutions:

1. **Check Documentation**:
   - [Environment Setup](./environment-setup.md) for configuration issues
   - [Architecture Guidelines](./architecture.md) for design questions
   - [Testing Guidelines](./testing.md) for test-related problems

2. **Debug Steps**:
   - Check browser developer console for client-side errors
   - Check terminal output for server-side errors
   - Use Supabase dashboard logs for database issues
   - Test API endpoints with REST Client files

3. **Create Minimal Reproduction**:
   - Isolate the problem to smallest possible example
   - Include relevant environment details
   - Share specific error messages and stack traces

4. **Community Resources**:
   - Next.js documentation and GitHub issues
   - Supabase documentation and Discord
   - TypeScript handbook for type issues