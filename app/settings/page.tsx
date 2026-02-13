'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { getUserProfile, upsertUserProfile, uploadCV } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { parseCV } from '@/actions/parse-cv';

export default function SettingsPage() {
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cvFile, setCvFile] = useState<File | null>(null);

    useEffect(() => {
        async function load() {
            const data = await getUserProfile();
            if (data) setProfile(data);
            setLoading(false);
        }
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        let cvUrl = profile.cv_url;
        let cvContent = profile.cv_content;

        try {
            if (cvFile) {
                // 1. Upload file
                const url = await uploadCV(cvFile);
                if (url) cvUrl = url;

                // 2. Parse content
                const formData = new FormData();
                formData.append("file", cvFile);
                const text = await parseCV(formData);
                if (text) cvContent = text;
            }

            await upsertUserProfile({
                ...profile,
                cv_url: cvUrl,
                cv_content: cvContent
            });

            // Refresh to ensure we have the latest (including potentially new ID)
            const updated = await getUserProfile();
            if (updated) setProfile(updated);

            alert('Profil et CV sauvegardés !');
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Erreur lors de la sauvegarde du profil (ou lecture du CV).");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Paramètres & Profil</h1>
                <Link href="/">
                    <Button variant="outline">Retour au Dashboard</Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                        <input
                            type="text"
                            name="full_name"
                            value={profile.full_name || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                        <input
                            type="text"
                            name="phone"
                            value={profile.phone || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Adresse</label>
                        <input
                            type="text"
                            name="address"
                            value={profile.address || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Bio & Préférences (Markdown)</label>
                    <p className="text-xs text-gray-500 mb-2">Décrivez votre parcours à 42, vos objectifs, et ce que vous recherchez.</p>
                    <textarea
                        name="bio_preferences"
                        rows={10}
                        value={profile.bio_preferences || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 font-mono"
                        placeholder="# Mon Parcours..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">CV Actuel</label>
                    {profile.cv_url && (
                        <div className="mb-2">
                            <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Voir le CV enregistré
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Sauvegarde...' : 'Sauvegarder le Profil'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
