import { marked } from "marked";

export interface ParsedDocumentImport {
  title: string;
  content: string; // HTML ready for Tiptap
}

/**
 * Parse uploaded file content into a title and rich-text HTML string.
 * Supports: .txt, .md, .markdown
 */
export async function parseImportedFile(
  fileName: string,
  rawContent: string
): Promise<ParsedDocumentImport> {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  let baseTitle = fileName.replace(/\.[^/.]+$/, "").trim() || "Imported Document";

  if (extension === "md" || extension === "markdown") {
    // Check if the markdown starts with a title / h1 (# Title)
    const lines = rawContent.split("\n");
    const firstH1Line = lines.find((line) => line.trim().startsWith("# "));
    if (firstH1Line) {
      baseTitle = firstH1Line.replace(/^#\s+/, "").trim();
    }

    // Convert markdown to HTML using marked
    const html = await marked.parse(rawContent, {
      gfm: true,
      breaks: true,
    });

    return {
      title: baseTitle,
      content: html,
    };
  } else {
    // Plaintext (.txt) conversion
    const paragraphs = rawContent
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      return {
        title: baseTitle,
        content: "<p></p>",
      };
    }

    const html = paragraphs
      .map((p) => {
        const escaped = p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\r?\n/g, "<br/>");
        return `<p>${escaped}</p>`;
      })
      .join("");

    return {
      title: baseTitle,
      content: html,
    };
  }
}

/**
 * Convert HTML/Tiptap content to plain text for export.
 */
export function convertHtmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.innerText || tempDiv.textContent || "";
}

/**
 * Convert HTML to basic Markdown for export.
 */
export function convertHtmlToMarkdown(html: string): string {
  let md = html;
  // Replace headings
  md = md.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n");
  // Replace formatting
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");
  md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, "> $1\n\n");
  md = md.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<ul[^>]*>/gi, "\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<ol[^>]*>/gi, "\n");
  md = md.replace(/<\/ol>/gi, "\n");
  md = md.replace(/<p>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");
  // Decode HTML entities
  md = md
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return md.trim();
}
