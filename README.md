# Intelligent Internship Manager — AI Job Application Prototype

A job-application management prototype combining a dashboard with LLM-assisted job-description analysis and CV matching.

**Status:** experimental / portfolio project, **not production-ready**. The repository is separate from any Notion + MCP workflow unless explicitly documented otherwise.

## Product idea

Job searches involve repetitive tasks: extracting structured information from vacancies, comparing requirements with a CV, drafting application materials and tracking next steps. This project explores a single interface for those workflows.

## Features explored

- Extract information from job descriptions with an LLM
- Compare a CV against an offer to identify possible gaps
- Generate drafts for application emails and cover letters
- Track applications in Kanban or table views
- Light/dark interface

## Technologies

- **Next.js / React** and Tailwind CSS
- **Supabase / PostgreSQL** for application data
- **Google Gemini SDK** for LLM requests
- **Optional OpenAI fallback** in the AI service
- PDF parsing for CV-related workflows

The AI implementation includes calls to Gemini and requests for JSON-formatted model responses. Generated results should be reviewed and validated; they are not verified facts.

## Run locally

Requirements: Node.js, npm, a Supabase project and a Gemini API key.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the server-side `GEMINI_API_KEY` in `.env.local`. Keep API keys out of version control. Open http://localhost:3000.

**Database/security warning:** The original example schema includes a permissive Supabase row-level-security policy (`using (true)`). Do **not** deploy that policy with personal CVs, application data or real users. Configure and verify authentication and user-scoped RLS policies before deployment. Review the SQL and access controls yourself before running the included schema.

## What I would improve before production

1. Enforce per-user database access and review all server/API authorization paths.
2. Validate structured LLM responses and handle missing, inconsistent or fabricated information.
3. Add automated integration tests and usage limits for AI endpoints.
4. Document a reproducible deployment process and test the full user journey.

This project demonstrates hands-on experimentation with AI-powered business workflows. It is not a claim of RAG, model training, or a production-grade agent platform.
