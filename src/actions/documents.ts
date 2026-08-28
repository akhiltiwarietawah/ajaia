"use server";

import { prisma } from "@/lib/prisma";
import { checkDocumentAccess, canEditDocument, isDocumentOwner } from "@/lib/access";
import { parseImportedFile } from "@/lib/import-export";
import { Role } from "@/types";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request lifecycle (e.g. unit/integration tests)
  }
}


export async function getUserDocuments(userId: string) {
  try {
    const [ownedDocs, shares] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: userId },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          shares: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.documentShare.findMany({
        where: { userId: userId },
        include: {
          document: {
            include: {
              owner: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              shares: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, avatar: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const sharedDocs = shares.map((s: any) => ({
      ...s.document,
      sharedRole: s.role as Role,
      sharedAt: s.createdAt,
    }));

    return {
      success: true,
      ownedDocs,
      sharedDocs,
    };
  } catch (error: any) {
    console.error("Error fetching user documents:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch documents",
      ownedDocs: [],
      sharedDocs: [],
    };
  }
}

export async function getDocumentById(docId: string, userId: string) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!doc) {
      return {
        success: false,
        error: "Document not found",
        status: 404,
        document: null,
        access: null,
      };
    }

    const access = checkDocumentAccess(doc, userId);

    if (!access.hasAccess) {
      return {
        success: false,
        error: "Forbidden: You do not have permission to view this document.",
        status: 403,
        document: null,
        access,
      };
    }

    return {
      success: true,
      document: doc,
      access,
      status: 200,
    };
  } catch (error: any) {
    console.error("Error fetching document by id:", error);
    return {
      success: false,
      error: error?.message || "Failed to retrieve document",
      status: 500,
      document: null,
      access: null,
    };
  }
}

export async function createDocumentAction(
  userId: string,
  title: string = "Untitled Document",
  content: string = ""
) {
  try {
    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: userId === "user_bob" ? "Bob Smith" : userId === "user_charlie" ? "Charlie Davis" : "Alice Johnson",
        email: `${userId}@ajaia.demo`,
      },
    });

    const doc = await prisma.document.create({
      data: {
        title: title.trim() || "Untitled Document",
        content: content || "<p></p>",
        ownerId: userId,
      },
    });

    safeRevalidate("/");
    return { success: true, document: doc };
  } catch (error: any) {
    console.error("Error creating document:", error);
    return { success: false, error: error?.message || "Failed to create document" };
  }
}

export async function updateDocumentContentAction(
  docId: string,
  userId: string,
  content: string,
  title?: string
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (!canEditDocument(doc, userId)) {
      return { success: false, error: "You do not have permission to edit this document" };
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        content,
        ...(title !== undefined ? { title: title.trim() || "Untitled Document" } : {}),
      },
    });

    return { success: true, document: updated };
  } catch (error: any) {
    console.error("Error updating document:", error);
    return { success: false, error: error?.message || "Failed to save document" };
  }
}

export async function renameDocumentAction(
  docId: string,
  userId: string,
  newTitle: string
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (!canEditDocument(doc, userId)) {
      return { success: false, error: "You do not have permission to rename this document" };
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: newTitle.trim() || "Untitled Document",
      },
    });

    safeRevalidate("/");
    safeRevalidate(`/doc/${docId}`);
    return { success: true, document: updated };
  } catch (error: any) {
    console.error("Error renaming document:", error);
    return { success: false, error: error?.message || "Failed to rename document" };
  }
}

export async function deleteDocumentAction(docId: string, userId: string) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (!isDocumentOwner(doc, userId)) {
      return { success: false, error: "Only the document owner can delete this document" };
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    safeRevalidate("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return { success: false, error: error?.message || "Failed to delete document" };
  }
}

export interface ShareRecipientInput {
  emailOrId: string;
  role: Role;
}

export async function shareDocumentBatchAction(
  docId: string,
  ownerUserId: string,
  recipients: ShareRecipientInput[]
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (!isDocumentOwner(doc, ownerUserId)) {
      return { success: false, error: "Only the document owner can share this document" };
    }

    if (!recipients || recipients.length === 0) {
      return { success: false, error: "No collaborators selected to share with." };
    }

    const successfulShares: any[] = [];
    const errors: string[] = [];

    for (const recipient of recipients) {
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: recipient.emailOrId },
            { email: recipient.emailOrId.toLowerCase().trim() },
          ],
        },
      });

      if (!targetUser) {
        errors.push(`User "${recipient.emailOrId}" not found`);
        continue;
      }

      if (targetUser.id === ownerUserId) {
        errors.push(`Cannot share with yourself (${targetUser.name})`);
        continue;
      }

      const share = await prisma.documentShare.upsert({
        where: {
          documentId_userId: {
            documentId: docId,
            userId: targetUser.id,
          },
        },
        update: {
          role: recipient.role,
        },
        create: {
          documentId: docId,
          userId: targetUser.id,
          role: recipient.role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      successfulShares.push(share);
    }

    safeRevalidate(`/doc/${docId}`);
    safeRevalidate("/");

    if (successfulShares.length === 0 && errors.length > 0) {
      return { success: false, error: errors.join("; ") };
    }

    return {
      success: true,
      shares: successfulShares,
      warning: errors.length > 0 ? `Partial failure: ${errors.join("; ")}` : undefined,
    };
  } catch (error: any) {
    console.error("Error sharing document in batch:", error);
    return { success: false, error: error?.message || "Failed to share document" };
  }
}

export async function shareDocumentAction(
  docId: string,
  ownerUserId: string,
  targetUserIdOrEmail: string,
  role: Role = "editor"
) {
  const result = await shareDocumentBatchAction(docId, ownerUserId, [
    { emailOrId: targetUserIdOrEmail, role },
  ]);

  if (result.success && result.shares && result.shares.length > 0) {
    return { success: true, share: result.shares[0] };
  }
  return { success: false, error: result.error || "Failed to share document" };
}

export async function revokeDocumentShareAction(
  docId: string,
  ownerUserId: string,
  targetUserId: string
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (!isDocumentOwner(doc, ownerUserId)) {
      return { success: false, error: "Only the document owner can manage collaborators" };
    }

    await prisma.documentShare.deleteMany({
      where: {
        documentId: docId,
        userId: targetUserId,
      },
    });

    safeRevalidate(`/doc/${docId}`);
    safeRevalidate("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error revoking document share:", error);
    return { success: false, error: error?.message || "Failed to revoke share" };
  }
}

export async function importDocumentAction(
  userId: string,
  fileName: string,
  fileContent: string
) {
  try {
    const parsed = await parseImportedFile(fileName, fileContent);

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: userId === "user_bob" ? "Bob Smith" : userId === "user_charlie" ? "Charlie Davis" : "Alice Johnson",
        email: `${userId}@ajaia.demo`,
      },
    });

    const doc = await prisma.document.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        ownerId: userId,
      },
    });

    safeRevalidate("/");
    return { success: true, documentId: doc.id };
  } catch (error: any) {
    console.error("Error importing document:", error);
    return { success: false, error: error?.message || "Failed to import document" };
  }
}
