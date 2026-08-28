const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL environment variable for seeding.");
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL database for seeding.");

  // 1. Seed Users
  await client.query(`
    INSERT INTO "User" ("id", "name", "email", "avatar")
    VALUES
      ('user_alice', 'Alice Johnson', 'alice@ajaia.demo', 'bg-emerald-600'),
      ('user_bob', 'Bob Smith', 'bob@ajaia.demo', 'bg-blue-600'),
      ('user_charlie', 'Charlie Davis', 'charlie@ajaia.demo', 'bg-purple-600')
    ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
  `);

  // 2. Seed Documents
  await client.query(`
    INSERT INTO "Document" ("id", "title", "content", "ownerId", "createdAt", "updatedAt")
    VALUES
      (
        'doc_welcome_alice',
        'Welcome to Ajaia Docs (by Alice)',
        '<h1>Welcome to Ajaia Docs</h1><p>This is a fast, lightweight collaborative document editor built with <strong>Next.js</strong> and <strong>Tiptap</strong>.</p><h2>Key Features:</h2><ul><li>Rich text formatting (headings, bold, italic, underline, lists)</li><li>Seamless file import (.txt and .md)</li><li>Sharing & permission model</li><li>Persistent document store</li></ul><p>Try editing this text or sharing it with Bob!</p>',
        'user_alice',
        now(),
        now()
      ),
      (
        'doc_quarterly_plan',
        'Q3 Product Roadmap (Shared with Bob)',
        '<h1>Q3 Product Strategy</h1><p>Welcome to our team strategy doc. Bob has editor access.</p><ol><li>Scale AI agent execution</li><li>Improve document import speed</li><li>Enhance real-time collaboration</li></ol>',
        'user_alice',
        now(),
        now()
      ),
      (
        'doc_bob_private',
        'Bob Engineering Notes',
        '<h1>Bob Engineering Scratchpad</h1><p>These are private engineering notes owned by Bob.</p><blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>',
        'user_bob',
        now(),
        now()
      )
    ON CONFLICT ("id") DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;
  `);

  // 3. Seed Share (Alice shares Q3 Roadmap with Bob)
  await client.query(`
    INSERT INTO "DocumentShare" ("id", "documentId", "userId", "role", "createdAt")
    VALUES ('share_roadmap_bob', 'doc_quarterly_plan', 'user_bob', 'editor', now())
    ON CONFLICT ("documentId", "userId") DO UPDATE SET role = EXCLUDED.role;
  `);

  console.log("Database seeded successfully!");

  // Verify and display records
  const users = await client.query('SELECT id, name, email FROM "User" ORDER BY name');
  console.log("Users in Database:", users.rows);

  const docs = await client.query('SELECT id, title, "ownerId" FROM "Document" ORDER BY title');
  console.log("Documents in Database:", docs.rows);

  const shares = await client.query('SELECT id, "documentId", "userId", role FROM "DocumentShare"');
  console.log("Shares in Database:", shares.rows);

  await client.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
