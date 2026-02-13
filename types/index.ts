
export type ApplicationStatus = 'En attente' | 'Postulé' | 'Entretien' | 'Refusé';

export interface Application {
    id: string;
    created_at: string;
    company_name: string;
    role: string;
    location?: string;
    status: ApplicationStatus;
    job_description?: string;
    missions?: string[];
    insights?: string;
    cover_letter?: string;
    email_content?: string;
    gap_analysis?: string;
    applied_at?: string;
    job_url?: string;
    tech_stack?: string[];
    daily_tasks_forecast?: string;
    recruitment_process?: string;
    profile_requirements?: string[];
    company_summary?: string;
    cover_letter_context?: string;
    cv_context_id?: string;
}

export interface UserProfile {
    id: string;
    created_at: string;
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    school?: string;
    availability_start?: string; // ex: "mars 2026"
    availability_duration_months?: number; // ex: 6
    bio_preferences?: string; // Markdown
    cv_url?: string;
    cv_content?: string;
}

export type ApplicationDraft = Omit<Application, 'id' | 'created_at'>;
