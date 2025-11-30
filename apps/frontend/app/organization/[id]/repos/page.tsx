import RepoPageClient from "./RepoPageClient";

interface RepoPageWrapperProps {
  params: { orgId: string };
}

export default function RepoPageWrapper({ params }: RepoPageWrapperProps) {
  const orgId = params.orgId;
  return <RepoPageClient orgId={orgId} />;
}

