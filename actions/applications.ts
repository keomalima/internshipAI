"use server";

import { createClient } from "@supabase/supabase-js";
import { Application, ApplicationDraft, ApplicationStatus } from "@/types";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getApplications(): Promise<Application[]> {
    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        return [];
    }

    return data as Application[];
}

export async function getApplicationById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching application:", error);
        return null;
    }

    return data as Application;
}

export async function createApplication(application: ApplicationDraft) {
    const { data, error } = await supabase
        .from("applications")
        .insert([application])
        .select()
        .single();

    if (error) {
        console.error("Error creating application:", error);
        throw new Error(error.message);
    }

    revalidatePath("/");
    return data;
}

export async function updateApplication(id: string, updates: Partial<Application>) {
    const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating application:", error);
        throw new Error(error.message);
    }
    revalidatePath("/");
    revalidatePath(`/applications/${id}`);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);

    if (error) {
        console.error("Error updating status:", error);
        throw new Error(error.message);
    }
    revalidatePath("/");
    revalidatePath(`/applications/${id}`);
}

export async function deleteApplication(id: string) {
    const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting application:", error);
        throw new Error(error.message);
    }
    revalidatePath("/");
}
