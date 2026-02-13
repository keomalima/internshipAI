-- Drop existing tables and types to start fresh
drop table if exists applications cascade;
drop table if exists user_profile cascade;
drop type if exists application_status cascade;

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
  gap_analysis text,
  applied_at timestamp with time zone,
  job_url text,
  tech_stack text[],
  daily_tasks_forecast text,
  recruitment_process text,
  profile_requirements text[],
  company_summary text,
  cover_letter_context text,
  cv_context_id uuid
);

create table user_profile (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  email text,
  phone text,
  address text,
  bio_preferences text,
  cv_url text,
  cv_content text
);

-- Enable Row Level Security (RLS)
alter table applications enable row level security;
alter table user_profile enable row level security;

-- Create a policy that allows all operations for now (can be restricted later if auth is added)
create policy "Enable all access for now" on applications for all using (true);
create policy "Enable all access for now" on user_profile for all using (true);

-- Storage bucket 'resumes'
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Storage Policy: Allow public access
create policy "Public Access"
  on storage.objects for all
  using ( bucket_id = 'resumes' );
