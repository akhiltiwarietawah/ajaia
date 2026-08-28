"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { importDocumentAction } from "@/actions/documents";
import {
  UploadCloud,
  FileText,
  FileCode,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ImportModal({ isOpen, onClose, userId }: ImportModalProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportedExtensions = [".txt", ".md", ".markdown"];

  const handleFileProcess = async (file: File) => {
    setErrorMessage("");
    const fileName = file.name;
    const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;

    if (!supportedExtensions.includes(extension)) {
      setErrorMessage(
        `Unsupported file type "${extension}". Please upload a .txt or .md (Markdown) file.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const textContent = await file.text();
      const result = await importDocumentAction(userId, fileName, textContent);

      if (result.success && result.documentId) {
        onClose();
        router.push(`/doc/${result.documentId}`);
      } else {
        setErrorMessage(result.error || "Failed to import file.");
      }
    } catch (err: any) {
      console.error("File reading error:", err);
      setErrorMessage(err.message || "Failed to read file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Import File
              </h3>
              <p className="text-xs text-slate-500">
                Create a new document from existing files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Supported Types Badges */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">Supported formats:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium shadow-xs">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                .txt
              </span>
              <span className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium shadow-xs">
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                .md
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
                : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-indigo-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  Parsing and creating document...
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    Upload plain text (.txt) or Markdown (.md)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
