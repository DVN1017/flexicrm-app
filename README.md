# FlexiCRM

FlexiCRM is a multi-tenant customer relationship management platform built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Current modules

- Authentication and company workspaces
- Company members and invitations
- WhatsApp conversations and message history
- Client records and client conversation history
- Sales pipelines and dossiers
- Conversation and dossier internal notes
- Dashboard activity indicators
- Meta WhatsApp webhook verification and delivery-status handling

Some integrations and database migrations still require validation against the connected Supabase project and a live Meta WhatsApp Business account. A feature present in the repository is not considered production-verified until its workflow has been tested.

## Requirements

- Node.js 20+
- npm
- A Supabase project (PostgreSQL 15+ recommended)

## Local setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env.local` file with the required values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   META_APP_SECRET=
   WHATSAPP_VERIFY_TOKEN=
   ```

   Never commit real credentials. The service-role key and Meta app secret must remain server-side and must never use a `NEXT_PUBLIC_` prefix.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Validation commands

Run these before considering a change ready:

```bash
npm run typecheck
npm run lint
npm run build
```

A GitHub Actions workflow runs these checks on pushes and pull requests.

## Supabase database

Apply SQL migrations in order from the Supabase SQL Editor:

1. `supabase/001_companies.sql`
2. `supabase/002_company_invitations.sql`
3. `supabase/003_conversations.sql`
4. `supabase/004_conversation_productivity.sql`
5. `supabase/005_pipelines_dossiers.sql`
6. `supabase/006_security_hardening.sql`

Before applying migrations to production, take a database backup and verify the target Supabase project. The migration files in GitHub do not prove that they have already been applied to a live database.

## WhatsApp webhook

Configure the Meta WhatsApp webhook callback URL as:

`https://YOUR_DOMAIN/api/webhooks/whatsapp`

Subscribe to the `messages` webhook field. Set `META_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` in the server environment. Test webhook verification, inbound messages and outbound delivery-status callbacks using a real Meta test number before production use.

## Deployment

Deploy the Next.js application to a Node.js-compatible host such as Vercel. Configure all environment variables in the host's server-side environment settings, then run the production build and test the complete user journey.
