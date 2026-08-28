const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo users and sample documents...");

  // Seed Users
  const alice = await prisma.user.upsert({
    where: { id: "user_alice" },
    update: {},
    create: {
      id: "user_alice",
      name: "Alice Johnson",
      email: "alice@ajaia.demo",
      avatar: "bg-emerald-600",
    },
  });

  const bob = await prisma.user.upsert({
    where: { id: "user_bob" },
    update: {},
    create: {
      id: "user_bob",
      name: "Bob Smith",
      email: "bob@ajaia.demo",
      avatar: "bg-blue-600",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { id: "user_charlie" },
    update: {},
    create: {
      id: "user_charlie",
      name: "Charlie Davis",
      email: "charlie@ajaia.demo",
      avatar: "bg-purple-600",
    },
  });

  console.log("Seeded users:", { alice: alice.name, bob: bob.name, charlie: charlie.name });

  // Seed Sample Documents
  const welcomeDoc = await prisma.document.upsert({
    where: { id: "doc_welcome_alice" },
    update: {},
    create: {
      id: "doc_welcome_alice",
      title: "Welcome to Ajaia Docs",
      content: `<h1>Welcome to Ajaia Docs</h1><p>This is a fast, lightweight collaborative document editor built with <strong>Next.js</strong> and <strong>Tiptap</strong>.</p><h2>Key Features:</h2><ul><li>Rich text formatting (headings, bold, italic, underline, lists)</li><li>Seamless file import (<strong>.txt</strong> and <strong>.md</strong>)</li><li>Role-based document sharing</li><li>Instant persistence & autosave</li></ul><p>Feel free to edit this document, switch demo users, or create a new one!</p>`,
      ownerId: alice.id,
    },
  });

  const roadmapDoc = await prisma.document.upsert({
    where: { id: "doc_quarterly_plan" },
    update: {},
    create: {
      id: "doc_quarterly_plan",
      title: "Q3 Product Roadmap (Shared with Bob)",
      content: `<h1>Q3 Product Strategy</h1><p>Welcome to our team strategy doc. <em>Bob has collaborator access</em>.</p><h2>Priorities:</h2><ol><li>Complete AI-Native Document Editor MVP</li><li>Verify Access Control logic</li><li>Provide clear architectural documentation</li></ol>`,
      ownerId: alice.id,
    },
  });

  const bobDoc = await prisma.document.upsert({
    where: { id: "doc_bob_private" },
    update: {},
    create: {
      id: "doc_bob_private",
      title: "Bob's Engineering Notes",
      content: `<h1>Bob's Engineering Scratchpad</h1><p>These are private engineering notes owned by Bob.</p><blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>`,
      ownerId: bob.id,
    },
  });

  // Seed Share (Alice shares roadmapDoc with Bob)
  await prisma.documentShare.upsert({
    where: {
      documentId_userId: {
        documentId: roadmapDoc.id,
        userId: bob.id,
      },
    },
    update: {},
    create: {
      id: "share_roadmap_bob",
      documentId: roadmapDoc.id,
      userId: bob.id,
      role: "editor",
    },
  });

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
