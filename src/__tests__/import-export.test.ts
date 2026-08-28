import { describe, it, expect } from "vitest";
import {
  parseImportedFile,
  convertHtmlToMarkdown,
  convertHtmlToPlainText,
} from "@/lib/import-export";

describe("File Import & Export Logic", () => {
  it("imports and parses Markdown (.md) with headings, bold, italic, and lists", async () => {
    const mdContent = `# Engineering Architecture

This is a **bold statement** and *italic note*.

- First bullet
- Second bullet

1. Step one
2. Step two
`;

    const parsed = await parseImportedFile("architecture.md", mdContent);

    expect(parsed.title).toBe("Engineering Architecture");
    expect(parsed.content).toContain("<h1");
    expect(parsed.content).toContain("<strong>bold statement</strong>");
    expect(parsed.content).toContain("<em>italic note</em>");
    expect(parsed.content).toContain("<li>First bullet</li>");
  });

  it("imports and parses Plaintext (.txt) into paragraph structures", async () => {
    const txtContent = `Line 1 of plain text.

Line 2 of plain text with <special> characters & symbols.`;

    const parsed = await parseImportedFile("notes.txt", txtContent);

    expect(parsed.title).toBe("notes");
    expect(parsed.content).toContain("<p>Line 1 of plain text.</p>");
    // Verify HTML escaping of special characters in plain text
    expect(parsed.content).toContain("&lt;special&gt;");
    expect(parsed.content).toContain("&amp;");
  });

  it("converts HTML back to Markdown for export", () => {
    const html = `<h1>Project Title</h1><p>Here is <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>`;
    const md = convertHtmlToMarkdown(html);

    expect(md).toContain("# Project Title");
    expect(md).toContain("**bold**");
    expect(md).toContain("*italic*");
    expect(md).toContain("- Item 1");
  });

  it("converts HTML back to Plaintext for export", () => {
    const html = `<h1>Project Title</h1><p>Paragraph 1</p><p>Paragraph 2</p>`;
    const text = convertHtmlToPlainText(html);

    expect(text).toContain("Project Title");
    expect(text).toContain("Paragraph 1");
    expect(text).toContain("Paragraph 2");
    expect(text).not.toContain("<h1");
  });
});
