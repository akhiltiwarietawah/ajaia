"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCurrentUser } from "@/context/UserContext";
import { ChevronDown, Check, UserCheck, Sparkles, ShieldAlert, User } from "lucide-react";

export function UserSwitcher() {
  const { currentUser, switchUser, allUsers } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserBadge = (id: string) => {
    switch (id) {
      case "user_alice":
        return {
          label: "Primary Owner",
          desc: "Creates documents & manages shares",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "user_bob":
        return {
          label: "Shared Collaborator",
          desc: "Receives document permissions",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "user_charlie":
        return {
          label: "Access Test User",
          desc: "Unrelated user (tests 403 Forbidden)",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      default:
        return {
          label: "Demo User",
          desc: "Testing account",
          bg: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-indigo-200 hover:border-indigo-300 bg-white hover:bg-slate-50 shadow-sm hover:shadow transition text-left group"
        title="Switch Demo Persona to test collaboration and access permissions"
      >
        {/* User Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ${
            currentUser.id === "user_alice"
              ? "bg-emerald-600"
              : currentUser.id === "user_bob"
              ? "bg-blue-600"
              : "bg-purple-600"
          }`}
        >
          {getInitials(currentUser.name)}
        </div>

        {/* User Info & Persona Label */}
        <div className="flex flex-col text-xs leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
              {currentUser.name}
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-1.5 py-0.2 rounded-full hidden md:inline">
              Demo Persona
            </span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {getUserBadge(currentUser.id).label}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-0.5 transition" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-2.5 py-2 mb-1.5 border-b border-slate-100 bg-slate-50/70 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Demo Persona Switcher
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-semibold">
                Simulated Auth
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Instant 1-click persona switching for reviewer evaluation of document permissions and 403 guards without passwords.
            </p>
          </div>

          {/* Personas List */}
          <div className="space-y-1">
            {allUsers.map((user) => {
              const isSelected = user.id === currentUser.id;
              const badge = getUserBadge(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setIsOpen(false);
                    // Fast window reload to re-fetch Server Component document lists for newly selected user
                    window.location.reload();
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                    isSelected
                      ? "bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-medium"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${
                      user.id === "user_alice"
                        ? "bg-emerald-600"
                        : user.id === "user_bob"
                        ? "bg-blue-600"
                        : "bg-purple-600"
                    }`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate text-slate-900">
                        {user.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Evaluation Testing Tip */}
          <div className="mt-2 pt-2 border-t border-slate-100 px-2.5 py-1.5 bg-indigo-50/50 rounded-xl text-[11px] text-indigo-900 leading-tight">
            💡 <strong>Evaluation Flow:</strong> Share a document as <strong>Alice</strong> with <strong>Bob</strong>, switch to <strong>Bob</strong> to edit, then switch to <strong>Charlie</strong> to verify 403 access denial.
          </div>
        </div>
      )}
    </div>
  );
}
