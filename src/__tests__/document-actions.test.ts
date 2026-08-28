import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createDocumentAction,
  getDocumentById,
  getUserDocuments,
  renameDocumentAction,
  updateDocumentContentAction,
  shareDocumentAction,
  revokeDocumentShareAction,
  deleteDocumentAction,
} from "@/actions/documents";

describe("Document Lifecycle & Sharing Integration Tests", () => {
  const aliceId = "user_alice";
  const bobId = "user_bob";
  const charlieId = "user_charlie";
  let testDocId = "";

  beforeAll(async () => {
    // Ensure test users exist
    await prisma.user.upsert({
      where: { id: aliceId },
      update: {},
      create: { id: aliceId, name: "Alice Johnson", email: "alice@ajaia.demo" },
    });
    await prisma.user.upsert({
      where: { id: bobId },
      update: {},
      create: { id: bobId, name: "Bob Smith", email: "bob@ajaia.demo" },
    });
    await prisma.user.upsert({
      where: { id: charlieId },
      update: {},
      create: { id: charlieId, name: "Charlie Davis", email: "charlie@ajaia.demo" },
    });
  });

  afterAll(async () => {
    if (testDocId) {
      await prisma.document.deleteMany({ where: { id: testDocId } });
    }
    await prisma.$disconnect();
  });

  it("1. Allows Alice to create a new document", async () => {
    const res = await createDocumentAction(
      aliceId,
      "Alice's Confidential Strategy",
      "<h1>Confidential</h1><p>Top secret plans.</p>"
    );
    expect(res.success).toBe(true);
    expect(res.document).toBeDefined();
    expect(res.document?.title).toBe("Alice's Confidential Strategy");
    expect(res.document?.ownerId).toBe(aliceId);
    testDocId = res.document!.id;
  });

  it("2. Allows Alice to rename her document", async () => {
    const res = await renameDocumentAction(testDocId, aliceId, "Alice's Updated Strategy");
    expect(res.success).toBe(true);
    expect(res.document?.title).toBe("Alice's Updated Strategy");
  });

  it("3. DENIES access to Charlie (unrelated user) with 403 Forbidden", async () => {
    const res = await getDocumentById(testDocId, charlieId);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain("Forbidden");
    expect(res.document).toBeNull();
  });

  it("4. DENIES access to Bob before document is shared", async () => {
    const res = await getDocumentById(testDocId, bobId);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
  });

  it("5. Allows Alice to share the document with Bob", async () => {
    const shareRes = await shareDocumentAction(testDocId, aliceId, "bob@ajaia.demo", "editor");
    expect(shareRes.success).toBe(true);
    expect(shareRes.share?.userId).toBe(bobId);
    expect(shareRes.share?.role).toBe("editor");
  });

  it("6. Allows Bob to retrieve the shared document and edit content", async () => {
    // Check retrieval
    const getRes = await getDocumentById(testDocId, bobId);
    expect(getRes.success).toBe(true);
    expect(getRes.status).toBe(200);
    expect(getRes.document?.id).toBe(testDocId);
    expect(getRes.access?.isOwner).toBe(false);
    expect(getRes.access?.role).toBe("editor");

    // Check Bob updating content
    const updateRes = await updateDocumentContentAction(
      testDocId,
      bobId,
      "<h1>Confidential</h1><p>Bob added notes here.</p>"
    );
    expect(updateRes.success).toBe(true);
    expect(updateRes.document?.content).toContain("Bob added notes here.");
  });

  it("7. Shows the document under Bob's 'Shared With Me' list", async () => {
    const userDocs = await getUserDocuments(bobId);
    expect(userDocs.success).toBe(true);
    const sharedFound = userDocs.sharedDocs.find((d: any) => d.id === testDocId);
    expect(sharedFound).toBeDefined();
    expect(sharedFound?.title).toBe("Alice's Updated Strategy");
    expect(sharedFound?.owner.id).toBe(aliceId);
  });

  it("8. Keeps Charlie blocked even after Alice shares with Bob", async () => {
    const res = await getDocumentById(testDocId, charlieId);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
  });

  it("9. Allows Alice to revoke Bob's access, immediately blocking Bob", async () => {
    const revokeRes = await revokeDocumentShareAction(testDocId, aliceId, bobId);
    expect(revokeRes.success).toBe(true);

    const bobGetRes = await getDocumentById(testDocId, bobId);
    expect(bobGetRes.success).toBe(false);
    expect(bobGetRes.status).toBe(403);
  });

  it("10. Allows Alice to delete her document", async () => {
    const deleteRes = await deleteDocumentAction(testDocId, aliceId);
    expect(deleteRes.success).toBe(true);

    const checkRes = await getDocumentById(testDocId, aliceId);
    expect(checkRes.success).toBe(false);
    expect(checkRes.status).toBe(404);
  });
});
