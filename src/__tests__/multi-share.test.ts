import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createDocumentAction,
  getDocumentById,
  getUserDocuments,
  updateDocumentContentAction,
  shareDocumentBatchAction,
  revokeDocumentShareAction,
  deleteDocumentAction,
} from "@/actions/documents";
import { canEditDocument } from "@/lib/access";

describe("Multi-Collaborator Single-Action Sharing Tests", () => {
  const aliceId = "user_alice";
  const bobId = "user_bob";
  const charlieId = "user_charlie";

  let multiShareDocId = "";
  let privateDocId = "";

  beforeAll(async () => {
    // 1. Create document to share with both Bob and Charlie
    const doc1 = await createDocumentAction(
      aliceId,
      "Q4 Multi-Team Plan",
      "<h1>Q4 Strategy</h1><p>Planning for all teams.</p>"
    );
    expect(doc1.success).toBe(true);
    multiShareDocId = doc1.document!.id;

    // 2. Create separate private document for Alice only
    const doc2 = await createDocumentAction(
      aliceId,
      "Alice's Strict Private Notes",
      "<h1>Private</h1><p>Strictly confidential.</p>"
    );
    expect(doc2.success).toBe(true);
    privateDocId = doc2.document!.id;
  });

  afterAll(async () => {
    if (multiShareDocId) {
      await prisma.document.deleteMany({ where: { id: multiShareDocId } });
    }
    if (privateDocId) {
      await prisma.document.deleteMany({ where: { id: privateDocId } });
    }
    await prisma.$disconnect();
  });

  it("1. Shares document with MULTIPLE users (Bob as editor, Charlie as viewer) in ONE operation", async () => {
    const batchRes = await shareDocumentBatchAction(multiShareDocId, aliceId, [
      { emailOrId: "bob@ajaia.demo", role: "editor" },
      { emailOrId: "charlie@ajaia.demo", role: "viewer" },
    ]);

    expect(batchRes.success).toBe(true);
    expect(batchRes.shares).toHaveLength(2);

    const bobShare = batchRes.shares?.find((s: any) => s.userId === bobId);
    const charlieShare = batchRes.shares?.find((s: any) => s.userId === charlieId);

    expect(bobShare).toBeDefined();
    expect(bobShare?.role).toBe("editor");

    expect(charlieShare).toBeDefined();
    expect(charlieShare?.role).toBe("viewer");
  });

  it("2. Verifies Bob has editor access on shared document", async () => {
    const res = await getDocumentById(multiShareDocId, bobId);
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    expect(res.access?.hasAccess).toBe(true);
    expect(res.access?.role).toBe("editor");
    expect(canEditDocument(res.document, bobId)).toBe(true);

    // Bob can write/update content
    const updateRes = await updateDocumentContentAction(
      multiShareDocId,
      bobId,
      "<p>Bob made an edit.</p>"
    );
    expect(updateRes.success).toBe(true);
  });

  it("3. Verifies Charlie has viewer access on shared document (read-only)", async () => {
    const res = await getDocumentById(multiShareDocId, charlieId);
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    expect(res.access?.hasAccess).toBe(true);
    expect(res.access?.role).toBe("viewer");
    expect(canEditDocument(res.document, charlieId)).toBe(false);

    // Charlie is BLOCKED from editing
    const updateRes = await updateDocumentContentAction(
      multiShareDocId,
      charlieId,
      "<p>Charlie attempting unauthorized edit.</p>"
    );
    expect(updateRes.success).toBe(false);
    expect(updateRes.error).toContain("permission");
  });

  it("4. Shows document in BOTH Bob and Charlie's 'Shared With Me' dashboards", async () => {
    const bobDocs = await getUserDocuments(bobId);
    expect(bobDocs.sharedDocs.some((d: any) => d.id === multiShareDocId)).toBe(true);

    const charlieDocs = await getUserDocuments(charlieId);
    expect(charlieDocs.sharedDocs.some((d: any) => d.id === multiShareDocId)).toBe(true);
  });

  it("5. Verifies Charlie is still FORBIDDEN (403) from Alice's separate private document", async () => {
    const res = await getDocumentById(privateDocId, charlieId);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain("Forbidden");
  });

  it("6. Allows revoking Charlie's access independently while Bob retains editor access", async () => {
    // Revoke Charlie
    const revokeRes = await revokeDocumentShareAction(multiShareDocId, aliceId, charlieId);
    expect(revokeRes.success).toBe(true);

    // Charlie is now 403 Forbidden
    const charlieCheck = await getDocumentById(multiShareDocId, charlieId);
    expect(charlieCheck.success).toBe(false);
    expect(charlieCheck.status).toBe(403);

    // Bob STILL has 200 OK editor access
    const bobCheck = await getDocumentById(multiShareDocId, bobId);
    expect(bobCheck.success).toBe(true);
    expect(bobCheck.status).toBe(200);
    expect(bobCheck.access?.role).toBe("editor");
    expect(canEditDocument(bobCheck.document, bobId)).toBe(true);
  });
});
