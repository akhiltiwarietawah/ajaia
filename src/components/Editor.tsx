"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { updateDocumentContentAction } from "@/actions/documents";
import { CheckCircle2, Clock, Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";

interface DocumentEditorProps {
  documentId: string;
  initialContent: string;
  initialTitle: string;
  userId: string;
  canEdit: boolean;
  onContentChange?: (content: string) => void;
  onSaveStatusChange?: (status: "saved" | "saving" | "unsaved" | "error") => void;
}

export function DocumentEditor({
  documentId,
  initialContent,
  initialTitle,
  userId,
  canEdit,
  onContentChange,
  onSaveStatusChange,
}: DocumentEditorProps) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef(initialContent);

  const notifyStatus = (status: "saved" | "saving" | "unsaved" | "error") => {
    setSaveStatus(status);
    onSaveStatusChange?.(status);
  };

  const performSave = useCallback(
    async (contentToSave: string) => {
      if (!canEdit) return;
      notifyStatus("saving");

      try {
        const result = await updateDocumentContentAction(documentId, userId, contentToSave);
        if (result.success) {
          notifyStatus("saved");
          setLastSavedAt(new Date());
        } else {
          console.error("Save error:", result.error);
          notifyStatus("error");
        }
      } catch (err) {
        console.error("Network save exception:", err);
        notifyStatus("error");
      }
    },
    [documentId, userId, canEdit]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: canEdit
          ? "Type your document content here... (Use the toolbar above for formatting, or try # for headings)"
          : "This document is read-only.",
      }),
    ],
    content: initialContent || "<p></p>",
    editable: canEdit,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!canEdit) return;
      const html = editor.getHTML();
      latestContentRef.current = html;
      notifyStatus("unsaved");
      onContentChange?.(html);

      // Debounce auto-save by 800ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSave(html);
      }, 800);
    },
  });

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcut Ctrl+S / Cmd+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editor && canEdit) {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          performSave(editor.getHTML());
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, canEdit, performSave]);

  const formatLastSavedTime = () => {
    if (!lastSavedAt) return "";
    return lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-100 min-h-screen">
      {/* Editor Formatting Toolbar */}
      <EditorToolbar editor={editor} readOnly={!canEdit} />

      {/* Read-Only Notice Banner if viewer */}
      {!canEdit && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>You have <strong>View-Only</strong> access to this document. Contact the owner to request editing permissions.</span>
        </div>
      )}

      {/* Main Document Body Canvas */}
      <div className="flex-1 flex justify-center py-8 px-4 sm:px-6 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-sheet border border-slate-200/80 min-h-[850px] p-8 sm:p-14 transition focus-within:shadow-md">
          <EditorContent editor={editor} className="outline-none" />
        </div>
      </div>

      {/* Floating Mini Save Indicator in bottom right */}
      <div className="fixed bottom-4 right-6 bg-white/90 backdrop-blur border border-slate-200 rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 text-xs text-slate-600 z-30 transition">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span className="font-medium text-slate-700">Saving to cloud...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600">
              Saved {lastSavedAt ? `at ${formatLastSavedTime()}` : ""}
            </span>
          </>
        )}
        {saveStatus === "unsaved" && (
          <>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-700 font-medium">Unsaved changes</span>
          </>
        )}
        {saveStatus === "error" && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-600 font-medium">Failed to save</span>
            <button
              onClick={() => editor && performSave(editor.getHTML())}
              className="text-indigo-600 underline font-semibold ml-1"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
