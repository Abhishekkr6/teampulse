import RepoPageClient from "./RepoPageClient";

interface RepoPageWrapperProps {
  params: { id: string };
}

export default async function RepoPageWrapper({ params }: RepoPageWrapperProps) {
  const resolved = await params;  
  const orgId = resolved.id;      

  return <RepoPageClient orgId={orgId} />;
}
