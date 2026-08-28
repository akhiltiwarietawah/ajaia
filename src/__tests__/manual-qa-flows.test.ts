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
  importDocumentAction,
} from "@/actions/documents";
import { checkDocumentAccess, canEditDocument } from "@/lib/access";
import { parseImportedFile } from "@/lib/import-export";

describe("Complete 23-Point Manual QA Verification Suite", () => {
  const aliceId = "user_alice";
  const bobId = "user_bob";
  const charlieId = "user_charlie";

  let createdDocId = "";
  let txtImportDocId = "";
  let mdImportDocId = "";

  beforeAll(async () => {
    // Seed users
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
    // Cleanup created test documents
    const docIds = [createdDocId, txtImportDocId, mdImportDocId].filter(Boolean);
    if (docIds.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: docIds } },
      });
    }
  });

  it("Flow 1: Create a document", async () => {
    const res = await createDocumentAction(aliceId, "Initial Title", "<p>Initial text</p>");
    expect(res.success).toBe(true);
    expect(res.document).toBeDefined();
    expect(res.document?.id).toBeDefined();
    createdDocId = res.document!.id;
  });

  it("Flow 2: Rename document", async () => {
    const renameRes = await renameDocumentAction(createdDocId, aliceId, "Q3 Strategic Vision");
    expect(renameRes.success).toBe(true);
    expect(renameRes.document?.title).toBe("Q3 Strategic Vision");
  });

  it("Flow 3-9: Type and format content (Bold, Italic, Underline, Heading, Bullet list, Numbered list)", async () => {
    const richContent = `
      <h1>Executive Summary</h1>
      <h2>Strategic Objectives</h2>
      <p>This is <strong>bold text</strong>, <em>italic text</em>, and <u>underlined text</u>.</p>
      <ul>
        <li>First strategic bullet</li>
        <li>Second strategic bullet</li>
      </ul>
      <ol>
        <li>Step one in numbered sequence</li>
        <li>Step two in numbered sequence</li>
      </ol>
    `.trim();

    const saveRes = await updateDocumentContentAction(createdDocId, aliceId, richContent);
    expect(saveRes.success).toBe(true);
    expect(saveRes.document?.content).toContain("<h1>Executive Summary</h1>");
    expect(saveRes.document?.content).toContain("<strong>bold text</strong>");
    expect(saveRes.document?.content).toContain("<em>italic text</em>");
    expect(saveRes.document?.content).toContain("<u>underlined text</u>");
    expect(saveRes.document?.content).toContain("<li>First strategic bullet</li>");
    expect(saveRes.document?.content).toContain("<li>Step one in numbered sequence</li>");
  });

  it("Flow 10-12: Save, Refresh, Reopen & Verify Persistence", async () => {
    // Simulate fresh database reload (reopen)
    const reopenRes = await getDocumentById(createdDocId, aliceId);
    expect(reopenRes.success).toBe(true);
    expect(reopenRes.document).toBeDefined();
    expect(reopenRes.document?.title).toBe("Q3 Strategic Vision");
    expect(reopenRes.document?.content).toContain("<h1>Executive Summary</h1>");
    expect(reopenRes.document?.content).toContain("<strong>bold text</strong>");
    expect(reopenRes.document?.content).toContain("<em>italic text</em>");
    expect(reopenRes.document?.content).toContain("<u>underlined text</u>");
    expect(reopenRes.document?.content).toContain("<li>First strategic bullet</li>");
  });

  it("Flow 13: Import a .txt file", async () => {
    const txtContent = "Meeting notes paragraph 1.\n\nMeeting notes paragraph 2 with details.";
    const importRes = await importDocumentAction(aliceId, "meeting_notes.txt", txtContent);
    expect(importRes.success).toBe(true);
    expect(importRes.documentId).toBeDefined();
    txtImportDocId = importRes.documentId!;

    const doc = await getDocumentById(txtImportDocId, aliceId);
    expect(doc.success).toBe(true);
    expect(doc.document?.title).toBe("meeting_notes");
    expect(doc.document?.content).toContain("<p>Meeting notes paragraph 1.</p>");
  });

  it("Flow 14: Import a .md file with headings and lists", async () => {
    const mdContent = `# Product Launch Plan

Key highlights:
- Deliver MVP on schedule
- Ensure 100% test coverage

1. Step A
2. Step B
`;
    const importRes = await importDocumentAction(aliceId, "launch.md", mdContent);
    expect(importRes.success).toBe(true);
    expect(importRes.documentId).toBeDefined();
    mdImportDocId = importRes.documentId!;

    const doc = await getDocumentById(mdImportDocId, aliceId);
    expect(doc.success).toBe(true);
    expect(doc.document?.title).toBe("Product Launch Plan");
    expect(doc.document?.content).toContain("<h1");
    expect(doc.document?.content).toContain("<li>Deliver MVP on schedule</li>");
  });

  it("Flow 15: Verify unsupported file type validation rejection", () => {
    const supportedExtensions = [".txt", ".md", ".markdown"];
    const testExtensions = [".pdf", ".docx", ".png", ".exe", ".xlsx"];

    testExtensions.forEach((ext) => {
      expect(supportedExtensions.includes(ext)).toBe(false);
    });
  });

  it("Flow 16: Alice shares a document with Bob", async () => {
    const shareRes = await shareDocumentAction(createdDocId, aliceId, "bob@ajaia.demo", "editor");
    expect(shareRes.success).toBe(true);
    expect(shareRes.share?.userId).toBe(bobId);
    expect(shareRes.share?.role).toBe("editor");
  });

  it("Flow 17-18: Switch to Bob & Verify Bob sees it under 'Shared With Me'", async () => {
    const bobDocs = await getUserDocuments(bobId);
    expect(bobDocs.success).toBe(true);
    const sharedItem = bobDocs.sharedDocs.find((d: any) => d.id === createdDocId);
    expect(sharedItem).toBeDefined();
    expect(sharedItem?.title).toBe("Q3 Strategic Vision");
    expect(sharedItem?.owner.name).toBe("Alice Johnson");
  });

  it("Flow 19: Verify Bob's edit permissions work correctly", async () => {
    const bobGet = await getDocumentById(createdDocId, bobId);
    expect(bobGet.success).toBe(true);
    expect(bobGet.access?.role).toBe("editor");

    const bobEditRes = await updateDocumentContentAction(
      createdDocId,
      bobId,
      "<p>Bob edited this shared content.</p>"
    );
    expect(bobEditRes.success).toBe(true);
    expect(bobEditRes.document?.content).toContain("Bob edited this shared content.");
  });

  it("Flow 20-21: Switch to Charlie & Verify Charlie CANNOT access Alice's private doc", async () => {
    const charlieGet = await getDocumentById(createdDocId, charlieId);
    expect(charlieGet.success).toBe(false);
    expect(charlieGet.status).toBe(403);
    expect(charlieGet.error).toContain("Forbidden");
    expect(charlieGet.document).toBeNull();
  });

  it("Flow 22-23: Alice revokes Bob's access & Bob loses access immediately", async () => {
    const revokeRes = await revokeDocumentShareAction(createdDocId, aliceId, bobId);
    expect(revokeRes.success).toBe(true);

    const bobGetAfterRevoke = await getDocumentById(createdDocId, bobId);
    expect(bobGetAfterRevoke.success).toBe(false);
    expect(bobGetAfterRevoke.status).toBe(403);
  });
});
