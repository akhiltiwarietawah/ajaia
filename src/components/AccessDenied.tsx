"use client";

import React from "react";
import Link from "next/link";
import { useCurrentUser } from "@/context/UserContext";
import { ShieldAlert, ArrowLeft, Users, Home } from "lucide-react";
import { UserSwitcher } from "./UserSwitcher";

interface AccessDeniedProps {
  documentId?: string;
  reason?: string;
}

export function AccessDenied({ documentId, reason }: AccessDeniedProps) {
  const { currentUser } = useCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-indigo-600 font-bold text-lg hover:opacity-90 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
            A
          </div>
          <span>Ajaia Docs</span>
        </Link>
        <UserSwitcher />
      </header>

      {/* Main Error Box */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              403 Forbidden
            </span>
            <h1 className="text-xl font-bold text-slate-800">Access Denied</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {reason || "You do not have permission to view or edit this document."}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs space-y-1.5 text-slate-600">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Current Persona: {currentUser.name}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Logged in as <code className="font-mono text-indigo-600">{currentUser.email}</code>. This document is private and has not been shared with this account.
            </p>
            <p className="text-[11px] text-slate-500">
              💡 <em>To test access: Switch user to the document owner or an authorized collaborator using the persona switcher at the top right.</em>
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
