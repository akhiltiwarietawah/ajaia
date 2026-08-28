import { describe, it, expect } from "vitest";
import { checkDocumentAccess, canEditDocument, isDocumentOwner } from "@/lib/access";

describe("Access Control Logic (Core Business Rules)", () => {
  const mockDoc = {
    id: "doc_123",
    ownerId: "user_alice",
    shares: [
      { userId: "user_bob", role: "editor" },
      { userId: "user_viewer", role: "viewer" },
    ],
  };

  it("grants full owner access to the document creator (Alice)", () => {
    const access = checkDocumentAccess(mockDoc, "user_alice");
    expect(access.hasAccess).toBe(true);
    expect(access.isOwner).toBe(true);
    expect(access.role).toBe("owner");
    expect(canEditDocument(mockDoc, "user_alice")).toBe(true);
    expect(isDocumentOwner(mockDoc, "user_alice")).toBe(true);
  });

  it("grants editor access to an explicitly shared collaborator (Bob)", () => {
    const access = checkDocumentAccess(mockDoc, "user_bob");
    expect(access.hasAccess).toBe(true);
    expect(access.isOwner).toBe(false);
    expect(access.role).toBe("editor");
    expect(canEditDocument(mockDoc, "user_bob")).toBe(true);
    expect(isDocumentOwner(mockDoc, "user_bob")).toBe(false);
  });

  it("grants view-only access to a viewer collaborator and prevents edits", () => {
    const access = checkDocumentAccess(mockDoc, "user_viewer");
    expect(access.hasAccess).toBe(true);
    expect(access.isOwner).toBe(false);
    expect(access.role).toBe("viewer");
    expect(canEditDocument(mockDoc, "user_viewer")).toBe(false);
    expect(isDocumentOwner(mockDoc, "user_viewer")).toBe(false);
  });

  it("DENIES access to an unrelated user (Charlie)", () => {
    const access = checkDocumentAccess(mockDoc, "user_charlie");
    expect(access.hasAccess).toBe(false);
    expect(access.isOwner).toBe(false);
    expect(access.role).toBeNull();
    expect(access.reason).toContain("Access denied");
    expect(canEditDocument(mockDoc, "user_charlie")).toBe(false);
    expect(isDocumentOwner(mockDoc, "user_charlie")).toBe(false);
  });

  it("handles non-existent or null documents gracefully", () => {
    const access = checkDocumentAccess(null, "user_alice");
    expect(access.hasAccess).toBe(false);
    expect(access.reason).toBe("Document not found");
  });
});
