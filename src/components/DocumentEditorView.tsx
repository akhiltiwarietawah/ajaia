"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/context/UserContext";
import { DocumentEditor } from "./Editor";
import { UserSwitcher } from "./UserSwitcher";
import { ShareModal } from "./ShareModal";
import { AccessDenied } from "./AccessDenied";
import { renameDocumentAction } from "@/actions/documents";
import { convertHtmlToMarkdown, convertHtmlToPlainText } from "@/lib/import-export";
import { DocumentWithRelations, Role } from "@/types";
import {
  ArrowLeft,
  Share2,
  Download,
  FileText,
  FileCode,
  File,
  Check,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface DocumentEditorViewProps {
  document: DocumentWithRelations | null;
  accessStatus: number;
  accessError?: string;
  isOwner: boolean;
  canEdit: boolean;
  userRole: Role | "owner" | null;
}

export function DocumentEditorView({
  document: initialDocument,
  accessStatus,
  accessError,
  isOwner,
  canEdit,
  userRole,
}: DocumentEditorViewProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [document, setDocument] = useState<DocumentWithRelations | null>(initialDocument);
  const [title, setTitle] = useState(initialDocument?.title || "Untitled Document");
  const [currentContent, setCurrentContent] = useState(initialDocument?.content || "");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If 403 Forbidden or unauthorized, render AccessDenied component
  if (accessStatus === 403 || !document) {
    return <AccessDenied reason={accessError} />;
  }

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleTitleBlur = async () => {
    if (!canEdit || !title.trim() || title === document.title) return;
    setIsRenaming(true);
    try {
      const result = await renameDocumentAction(document.id, currentUser.id, title.trim());
      if (result.success && result.document) {
        setDocument((prev) => (prev ? { ...prev, title: result.document!.title } : prev));
      }
    } catch (e) {
      console.error("Rename failed", e);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleDownload = (format: "md" | "txt" | "html") => {
    setIsExportMenuOpen(false);
    let fileContent = "";
    let mimeType = "text/plain";
    let extension = format;

    if (format === "md") {
      fileContent = convertHtmlToMarkdown(currentContent);
      mimeType = "text/markdown";
    } else if (format === "txt") {
      fileContent = convertHtmlToPlainText(currentContent);
      mimeType = "text/plain";
    } else {
      fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${document.title}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1, h2, h3 { color: #1e293b; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #475569; }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  ${currentContent}
</body>
</html>`;
      mimeType = "text/html";
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title.toLowerCase().replace(/[^a-z0-9]/gi, "_")}.${extension}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        {/* Left: Back button + Title input */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-200 shrink-0" />

          {/* Editable Document Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-lg">
            <input
              type="text"
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-base sm:text-lg font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none truncate w-full disabled:hover:bg-transparent disabled:hover:border-transparent"
              title={canEdit ? "Click to rename document" : "Document title (read-only)"}
            />
            {isOwner ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold shrink-0 hidden md:inline">
                Owner
              </span>
            ) : (
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold shrink-0 hidden md:inline">
                {userRole === "editor" ? "Shared (Can Edit)" : "Shared (Viewer)"}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (Share, Export, User Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs"
              title="Export document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleDownload("md")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition"
                >
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("txt")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Plain Text (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("html")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition"
                >
                  <File className="w-4 h-4 text-purple-600" />
                  <span>HTML Document (.html)</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
            {document.shares && document.shares.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-bold">
                {document.shares.length}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />

          {/* Demo User Switcher */}
          <UserSwitcher />
        </div>
      </header>

      {/* Tiptap Rich-Text Editor Component */}
      <DocumentEditor
        documentId={document.id}
        initialContent={document.content}
        initialTitle={document.title}
        userId={currentUser.id}
        canEdit={canEdit}
        onContentChange={(newHtml) => setCurrentContent(newHtml)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={document.id}
        documentTitle={document.title}
        ownerName={document.owner.name}
        ownerEmail={document.owner.email}
        currentUserId={currentUser.id}
        isOwner={isOwner}
        shares={document.shares || []}
        onSharesUpdated={(sharedTargetName?: string) => {
          if (sharedTargetName) {
            showToast(`Document shared with ${sharedTargetName}`);
          }
          router.refresh();
        }}
      />
    </div>
  );
}
