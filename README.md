# Intelligent Internship Manager

This is an AI-powered Internship Application Manager built with Next.js 14, Supabase, and Google Gemini.

## Features

- **Job Analysis**: Extract key info (Company, Role, Missions) from job descriptions using AI.
- **CV Analysis**: Compare your CV with job offers (Gap Analysis).
- **Content Generation**: Generate personalized cover letters and emails.
- **Dashboard**: Track applications with a Kanban or Table view.
- **Dark/Light Mode**: Minimalist Notion-style interface.

## Prerequisites

- **Node.js 20+** (Required for Next.js 14 Server Actions)
- **Supabase Account**: For the database.
- **Google Gemini API Key**: For AI features.

## Setup

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```
3.  **Environment Variables**:
    Create a `.env.local` file in the root directory and add:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Database Setup (Supabase)**:
    Go to your Supabase Dashboard -> SQL Editor and run the script found in `supabase/schema.sql`:

    ```sql
    -- Create the applications table
    create type application_status as enum ('En attente', 'Postulé', 'Entretien', 'Refusé');

    create table applications (
      id uuid default gen_random_uuid() primary key,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      company_name text not null,
      role text not null,
      location text,
      status application_status default 'En attente'::application_status,
      job_description text,
      missions text[],
      insights text,
      cover_letter text,
      email_content text,
      gap_analysis text
    );

    -- Enable Row Level Security (RLS)
    alter table applications enable row level security;
    create policy "Enable all access for now" on applications for all using (true);
    ```

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI**: Google Gemini SDK (`@google/generative-ai`)
- **PDF Parsing**: `pdf-parse`
