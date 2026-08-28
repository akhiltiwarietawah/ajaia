"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/context/UserContext";
import {
  createDocumentAction,
  deleteDocumentAction,
  renameDocumentAction,
} from "@/actions/documents";
import { UserSwitcher } from "./UserSwitcher";
import { ImportModal } from "./ImportModal";
import { ShareModal } from "./ShareModal";
import { FormattedDate } from "./FormattedDate";
import { Role } from "@/types";
import {
  Plus,
  UploadCloud,
  Search,
  FileText,
  Clock,
  Users,
  Trash2,
  Edit2,
  Share2,
  FolderOpen,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  shares: any[];
  sharedRole?: Role;
}

interface DashboardProps {
  initialOwnedDocs: DocumentItem[];
  initialSharedDocs: DocumentItem[];
}

export function Dashboard({ initialOwnedDocs, initialSharedDocs }: DashboardProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [ownedDocs, setOwnedDocs] = useState<DocumentItem[]>(initialOwnedDocs);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>(initialSharedDocs);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Share modal state
  const [shareDocTarget, setShareDocTarget] = useState<DocumentItem | null>(null);

  // Rename modal / inline state
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateDocument = async () => {
    setIsCreating(true);
    try {
      const result = await createDocumentAction(currentUser.id, "Untitled Document");
      if (result.success && result.document) {
        router.push(`/doc/${result.document.id}`);
      } else {
        alert(result.error || "Failed to create document");
        setIsCreating(false);
      }
    } catch (err: any) {
      alert("Failed to create document: " + err.message);
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const result = await deleteDocumentAction(docId, currentUser.id);
      if (result.success) {
        setOwnedDocs((prev) => prev.filter((d) => d.id !== docId));
      } else {
        alert(result.error || "Failed to delete document");
      }
    } catch (err: any) {
      alert("Error deleting document: " + err.message);
    }
  };

  const handleStartRename = (doc: DocumentItem) => {
    setRenamingDocId(doc.id);
    setNewTitleInput(doc.title);
  };

  const handleSaveRename = async (docId: string) => {
    if (!newTitleInput.trim()) return;
    setIsRenaming(true);
    try {
      const result = await renameDocumentAction(docId, currentUser.id, newTitleInput.trim());
      if (result.success) {
        setOwnedDocs((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, title: newTitleInput.trim() } : d))
        );
        setRenamingDocId(null);
      } else {
        alert(result.error || "Failed to rename document");
      }
    } catch (err: any) {
      alert("Error renaming document: " + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const filteredOwnedDocs = ownedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedDocs = sharedDocs.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm transition">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Ajaia Docs</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 hidden sm:inline-block">
                AI-Native Editor
              </span>
            </div>
          </Link>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none"
              />
            </div>
          </div>

          {/* User Persona Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <UserSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Hero Banner with Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Create a document, import Markdown/.txt files, or collaborate via real-time sharing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-indigo-300" />
              <span>Import File (.txt / .md)</span>
            </button>

            <button
              onClick={handleCreateDocument}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>New Document</span>
            </button>
          </div>

          {/* Decorative background glow */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* SECTION 1: Owned Documents */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Owned Documents
              </h2>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {filteredOwnedDocs.length}
              </span>
            </div>
          </div>

          {filteredOwnedDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOwnedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header with Title & Inline Rename */}
                    <div className="flex items-start justify-between gap-2">
                      {renamingDocId === doc.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={newTitleInput}
                            onChange={(e) => setNewTitleInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(doc.id)}
                            className="text-sm font-semibold px-2 py-1 border border-indigo-500 rounded focus:outline-none w-full bg-slate-50"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(doc.id)}
                            disabled={isRenaming}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <Link
                          href={`/doc/${doc.id}`}
                          className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition flex-1 line-clamp-1"
                        >
                          {doc.title}
                        </Link>
                      )}
                    </div>

                    {/* Meta info: last updated, collaborators */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <FormattedDate date={doc.updatedAt} />
                      </span>

                      {doc.shares && doc.shares.length > 0 && (
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px] font-medium border border-indigo-100">
                          <Users className="w-3 h-3" />
                          {doc.shares.length} shared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/doc/${doc.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Document</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShareDocTarget(doc)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Share document"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartRename(doc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="Rename document"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No owned documents yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "New Document" to start writing from scratch, or "Import File" to upload an existing .txt or .md file.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 2: Shared With Me */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Shared With Me
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {filteredSharedDocs.length}
              </span>
            </div>
          </div>

          {filteredSharedDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSharedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/doc/${doc.id}`}
                        className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition flex-1 line-clamp-1"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        {doc.sharedRole === "editor" ? "Can Edit" : "Can View"}
                      </span>
                    </div>

                    {/* Owner Badge & Timestamp */}
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center">
                          {doc.owner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-700 font-medium truncate">
                          Owner: {doc.owner.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <FormattedDate date={doc.updatedAt} prefix="Last updated " />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/doc/${doc.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Document</span>
                    </Link>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Collaborator
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No documents shared with you</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When another team member shares a document with <strong>{currentUser.name}</strong>, it will appear here.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={currentUser.id}
      />

      {/* Share Modal */}
      {shareDocTarget && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareDocTarget(null)}
          documentId={shareDocTarget.id}
          documentTitle={shareDocTarget.title}
          ownerName={shareDocTarget.owner.name}
          ownerEmail={shareDocTarget.owner.email}
          currentUserId={currentUser.id}
          isOwner={shareDocTarget.ownerId === currentUser.id}
          shares={shareDocTarget.shares || []}
          onSharesUpdated={(sharedTargetName?: string) => {
            if (sharedTargetName) {
              showToast(`Document shared with ${sharedTargetName}`);
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
