import { cookies } from "next/headers";
import { getUserDocuments } from "@/actions/documents";
import { Dashboard } from "@/components/Dashboard";
import { DEFAULT_USER } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = cookies();
  const activeUserId = cookieStore.get("ajaia_active_user")?.value || DEFAULT_USER.id;

  const result = await getUserDocuments(activeUserId);

  return (
    <Dashboard
      initialOwnedDocs={result.ownedDocs || []}
      initialSharedDocs={result.sharedDocs || []}
    />
  );
}
