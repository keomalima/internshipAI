
import ApplicationEditor from "@/components/ApplicationEditor";
import { getApplicationById } from "@/actions/applications";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ApplicationDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const application = await getApplicationById(id);

    if (!application) {
        notFound();
    }

    return <ApplicationEditor application={application} />;
}
