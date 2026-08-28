-- Supabase PostgreSQL Schema for Ajaia Collaborative Document Editor
-- This SQL can be directly executed in the Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT DEFAULT 'Untitled Document' NOT NULL,
    "content" TEXT DEFAULT '' NOT NULL,
    "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Document Shares Table
CREATE TABLE IF NOT EXISTS "DocumentShare" (
    "id" TEXT PRIMARY KEY,
    "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role" TEXT DEFAULT 'editor' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "DocumentShare_documentId_userId_key" UNIQUE ("documentId", "userId")
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS "Document_ownerId_idx" ON "Document"("ownerId");
CREATE INDEX IF NOT EXISTS "DocumentShare_userId_idx" ON "DocumentShare"("userId");
CREATE INDEX IF NOT EXISTS "DocumentShare_documentId_idx" ON "DocumentShare"("documentId");

-- 5. Seed Initial Demo Users
INSERT INTO "User" ("id", "name", "email", "avatar")
VALUES
    ('user_alice', 'Alice Johnson', 'alice@ajaia.demo', 'bg-emerald-600'),
    ('user_bob', 'Bob Smith', 'bob@ajaia.demo', 'bg-blue-600'),
    ('user_charlie', 'Charlie Davis', 'charlie@ajaia.demo', 'bg-purple-600')
ON CONFLICT ("id") DO NOTHING;

-- 6. Seed Sample Documents
INSERT INTO "Document" ("id", "title", "content", "ownerId", "createdAt", "updatedAt")
VALUES
    ('doc_welcome_alice', 'Welcome to Ajaia Docs (by Alice)', '<h1>Welcome to Ajaia Docs</h1><p>This is a fast, lightweight collaborative document editor built with <strong>Next.js</strong> and <strong>Tiptap</strong>.</p><h2>Key Features:</h2><ul><li>Rich text formatting (headings, bold, italic, underline, lists)</li><li>Seamless file import (.txt and .md)</li><li>Sharing & permission model</li><li>Persistent document store</li></ul><p>Try editing this text or sharing it with Bob!</p>', 'user_alice', now(), now()),
    ('doc_quarterly_plan', 'Q3 Product Roadmap (Shared with Bob)', '<h1>Q3 Product Strategy</h1><p>Welcome to our team strategy doc. Bob has editor access.</p><ol><li>Scale AI agent execution</li><li>Improve document import speed</li><li>Enhance real-time collaboration</li></ol>', 'user_alice', now(), now()),
    ('doc_bob_private', 'Bob''s Engineering Notes', '<h1>Bob''s Engineering Scratchpad</h1><p>These are private engineering notes owned by Bob.</p><blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>', 'user_bob', now(), now())
ON CONFLICT ("id") DO NOTHING;

-- 7. Seed Sample Share (Alice shares Q3 Roadmap with Bob)
INSERT INTO "DocumentShare" ("id", "documentId", "userId", "role", "createdAt")
VALUES
    ('share_roadmap_bob', 'doc_quarterly_plan', 'user_bob', 'editor', now())
ON CONFLICT ("documentId", "userId") DO NOTHING;
