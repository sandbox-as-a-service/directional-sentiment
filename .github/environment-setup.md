# Environment Setup

Complete guide for configuring your development environment for the Directional Sentiment project.

## Required Environment Variables

The application requires Supabase configuration for database access and authentication.

### Development Environment

#### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

#### 2. Configure Supabase Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Environment Variable Usage

| Variable | Purpose | Required | Notes |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | Public (exposed to browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous access key | Yes | Public (exposed to browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access key | Yes | Server-only (never exposed) |

**Security Note**: The `NEXT_PUBLIC_*` variables are exposed to the browser. The `SUPABASE_SERVICE_ROLE_KEY` is server-only and should never be exposed to client code.

## Environment Validation

The application uses Zod schemas to validate environment variables at startup:

```typescript
// src/app/_config/env.ts
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})
```

**GitHub Actions Exception**: In CI/CD, empty defaults are allowed for environment variables to support build processes without real credentials.

## Development vs Production

### Development (.env.local)
- Used for local development
- File is gitignored for security
- Can use development/testing Supabase project

### Production (.env.production.local or Platform Variables)
- Used for production builds
- Should use production Supabase project
- Environment variables set via deployment platform (Vercel, etc.)

### Environment File Priority (Next.js)
1. `.env.production.local` (production builds)
2. `.env.local` (always loaded, gitignored)
3. `.env.production` (production, tracked in git)
4. `.env.development` (development, tracked in git)  
5. `.env` (default, tracked in git)

## Supabase Database Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and project name
4. Set database password
5. Choose region closest to your users

### 2. Setup Database Schema
```sql
-- Example schema (check supabase/migrations/ for complete schema)
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id),
  user_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Configure Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Example policies (check supabase/ directory for complete policies)
CREATE POLICY "Polls are publicly readable" ON polls FOR SELECT USING (true);
CREATE POLICY "Votes can be created by authenticated users" ON votes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

### 4. Generate TypeScript Types
```bash
npm run supabase:typegen
```

This updates `src/app/(adapters)/(out)/supabase/types.ts` with current database schema.

## Local Development Tools

### VS Code Extensions (Recommended)
- **REST Client** - For testing API endpoints (files in `rest-client/`)
- **Supabase** - For database management
- **TypeScript** - For type checking
- **ESLint** - For code linting
- **Prettier** - For code formatting

### REST Client Configuration
API testing uses `.http` files in the `rest-client/` directory:

```http
# rest-client/polls.http
@baseUrl = http://localhost:3000

### Get poll feed
GET {{baseUrl}}/api/polls/feed

### Cast vote  
POST {{baseUrl}}/api/polls/favorite-color/votes
Content-Type: application/json

{
  "optionId": "red"
}
```

## Troubleshooting Environment Issues

### Common Environment Variable Errors

#### Missing Environment Variables
```
Error: Environment variable NEXT_PUBLIC_SUPABASE_URL is required
```
**Solution**: Ensure `.env.local` exists and contains all required variables.

#### Invalid Supabase URL
```
Error: Invalid URL format for NEXT_PUBLIC_SUPABASE_URL
```
**Solution**: Check that the Supabase URL follows the format `https://your-project-id.supabase.co`

#### Wrong Supabase Keys
```
Error: Invalid API key or insufficient permissions
```
**Solutions**:
- Verify keys are copied correctly from Supabase dashboard
- Ensure no extra whitespace in environment file
- Check that service role key is used for server-side operations

### Supabase Connection Issues

#### Network/CORS Errors
```
Error: Failed to fetch from Supabase
```
**Solutions**:
- Check internet connection
- Verify Supabase project is active (not paused)
- Check browser console for CORS errors

#### RLS Policy Errors
```
Error: Row Level Security policy violation
```
**Solutions**:
- Check that RLS policies are configured correctly
- Verify user authentication state
- Ensure policies match your application's access patterns

### Build/Runtime Issues

#### TypeScript Errors
```
Error: Property 'xyz' does not exist on type 'Database'
```
**Solution**: Run `npm run supabase:typegen` to regenerate types after schema changes.

#### Environment Variables Not Loading
**Solutions**:
- Restart development server after changing `.env.local`
- Check file naming (`.env.local` not `.env.dev`)
- Verify file is in project root directory

## Multiple Environment Setup

### Team Development
Each developer should:
1. Create their own Supabase project for development
2. Use their own `.env.local` file (gitignored)
3. Share schema via `supabase/migrations/` (tracked in git)

### Staging Environment
```bash
# .env.staging.local
NEXT_PUBLIC_SUPABASE_URL=https://staging-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-role-key
```

### Production Environment
Environment variables should be set via your deployment platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables  
- **Railway**: Project Variables
- **Docker**: Environment variables or secrets

## Security Best Practices

### Environment Variable Security
- ✅ Never commit `.env.local` or `.env.production.local`
- ✅ Use different Supabase projects for dev/staging/production
- ✅ Rotate service role keys regularly
- ✅ Set up proper RLS policies
- ❌ Never expose service role key to client code
- ❌ Don't share credentials in chat/email

### Supabase Security
- Enable RLS on all tables
- Use least-privilege policies
- Regularly audit access patterns
- Monitor Supabase dashboard for unusual activity

For more detailed security considerations, see [Database Guidelines](./database.md).