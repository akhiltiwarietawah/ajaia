import { cookies } from "next/headers";
import { getDocumentById } from "@/actions/documents";
import { DocumentEditorView } from "@/components/DocumentEditorView";
import { DEFAULT_USER } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface DocPageProps {
  params: {
    id: string;
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const cookieStore = cookies();
  const activeUserId = cookieStore.get("ajaia_active_user")?.value || DEFAULT_USER.id;

  const result = await getDocumentById(params.id, activeUserId);

  if (!result.success || !result.document) {
    return (
      <DocumentEditorView
        document={null}
        accessStatus={result.status || 404}
        accessError={result.error || "Document not found or access denied"}
        isOwner={false}
        canEdit={false}
        userRole={null}
      />
    );
  }

  const isOwner = result.access?.isOwner ?? false;
  const canEdit = isOwner || result.access?.role === "editor";
  const userRole = result.access?.role ?? null;

  return (
    <DocumentEditorView
      document={result.document as any}
      accessStatus={200}
      isOwner={isOwner}
      canEdit={canEdit}
      userRole={userRole}
    />
  );
}
