import RepoPageClient from "./RepoPageClient";

interface RepoPageWrapperProps {
  params: { id: string };
}

export default function RepoPageWrapper({ params }: RepoPageWrapperProps) {
  const orgId = params.id;
  return <RepoPageClient orgId={orgId} />;
}

