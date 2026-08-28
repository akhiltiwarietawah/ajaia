import { AccessCheckResult, Role } from "@/types";

export interface DocumentWithShares {
  id: string;
  ownerId: string;
  shares?: Array<{
    userId: string;
    role: string;
  }>;
}

/**
 * Pure function to check whether a given user has permission to access a document.
 * Distinguishes:
 * 1. Owner: Full access (view, edit, rename, delete, manage shares).
 * 2. Shared User: Access according to granted role ('editor' or 'viewer').
 * 3. Unrelated User: Access denied (403 Forbidden).
 */
export function checkDocumentAccess(
  doc: DocumentWithShares | null | undefined,
  userId: string
): AccessCheckResult {
  if (!doc) {
    return {
      hasAccess: false,
      isOwner: false,
      role: null,
      reason: "Document not found",
    };
  }

  // 1. Owner check
  if (doc.ownerId === userId) {
    return {
      hasAccess: true,
      isOwner: true,
      role: "owner",
    };
  }

  // 2. Shared collaborator check
  const share = doc.shares?.find((s) => s.userId === userId);
  if (share) {
    return {
      hasAccess: true,
      isOwner: false,
      role: (share.role as Role) || "editor",
    };
  }

  // 3. Unrelated user - Access Denied
  return {
    hasAccess: false,
    isOwner: false,
    role: null,
    reason: "Access denied. You do not have permission to view this document.",
  };
}

/**
 * Check if a user can edit document content.
 */
export function canEditDocument(
  doc: DocumentWithShares | null | undefined,
  userId: string
): boolean {
  const access = checkDocumentAccess(doc, userId);
  if (!access.hasAccess) return false;
  if (access.isOwner) return true;
  return access.role === "editor";
}

/**
 * Check if a user can manage sharing / delete the document (Owner only).
 */
export function isDocumentOwner(
  doc: DocumentWithShares | null | undefined,
  userId: string
): boolean {
  return doc?.ownerId === userId;
}
