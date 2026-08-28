"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export function EditorToolbar({ editor, readOnly = false }: EditorToolbarProps) {
  if (!editor || readOnly) return null;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("heading", { level: 1 })
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("heading", { level: 3 })
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Styles: Bold, Italic, Underline, Strike */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("bold")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("italic")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("underline")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("strike")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("bulletList")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("orderedList")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Blocks: Blockquote, Code Block */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("blockquote")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition ${
            editor.isActive("codeBlock")
              ? "bg-indigo-100 text-indigo-700 font-semibold"
              : "hover:bg-slate-100 text-slate-700"
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Clear Formatting */}
      <div className="flex items-center gap-0.5 pl-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
