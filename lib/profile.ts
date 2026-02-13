import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export const USER_PROFILE_ID = '00000000-0000-0000-0000-000000000000'; // Singleton ID for now

export async function getUserProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data;
}

export async function upsertUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    // Ensure we are updating the singleton record if it exists, or creating it with a fixed ID if we want to enforce singleton behavior literally.
    // However, `maybeSingle` above implies we just take one.
    // For better singleton behavior without Auth, we might want to check if one exists.

    const existing = await getUserProfile();

    let result;
    if (existing) {
        result = await supabase
            .from('user_profile')
            .update(profile)
            .eq('id', existing.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from('user_profile')
            .insert([profile])
            .select()
            .single();
    }

    if (result.error) {
        console.error('Error upserting user profile:', result.error);
        return null;
    }

    return result.data;
}

export async function uploadCV(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `cv-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('resumes') // Make sure this bucket exists
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading CV:', uploadError);
        return null;
    }

    const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
    return data.publicUrl;
}
