"use client";

import React, { useState } from "react";
import { shareDocumentBatchAction, revokeDocumentShareAction } from "@/actions/documents";
import { DocumentShareInfo, Role } from "@/types";
import { DEMO_USERS } from "@/lib/auth";
import {
  X,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  Lock,
  UserCheck,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  ownerName: string;
  ownerEmail: string;
  currentUserId: string;
  isOwner: boolean;
  shares: DocumentShareInfo[];
  onSharesUpdated: (sharedSummary?: string) => void;
}

interface SelectedRecipientState {
  [email: string]: {
    selected: boolean;
    role: Role;
    name: string;
  };
}

export function ShareModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  ownerName,
  ownerEmail,
  currentUserId,
  isOwner,
  shares,
  onSharesUpdated,
}: ShareModalProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipientState>({});
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState<Role>("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Filter available demo users who aren't the owner or already shared
  const availableUsers = DEMO_USERS.filter((u) => {
    if (u.id === currentUserId) return false;
    const isShared = shares.some(
      (s) => s.userId === u.id || s.user.email.toLowerCase() === u.email.toLowerCase()
    );
    return !isShared;
  });

  const toggleUserSelection = (email: string, name: string, defaultRole: Role = "editor") => {
    setSelectedRecipients((prev) => {
      const current = prev[email];
      if (current && current.selected) {
        const next = { ...prev };
        delete next[email];
        return next;
      }
      return {
        ...prev,
        [email]: {
          selected: true,
          role: current?.role || defaultRole,
          name,
        },
      };
    });
  };

  const updateUserRole = (email: string, role: Role) => {
    setSelectedRecipients((prev) => {
      if (!prev[email]) return prev;
      return {
        ...prev,
        [email]: {
          ...prev[email],
          role,
        },
      };
    });
  };

  const handleAddCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    // Check if already shared
    const isShared = shares.some((s) => s.user.email.toLowerCase() === cleanEmail);
    if (isShared) {
      setErrorMessage(`User "${cleanEmail}" already has access to this document.`);
      return;
    }

    const demoMatch = DEMO_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    const displayName = demoMatch ? demoMatch.name : cleanEmail;

    setSelectedRecipients((prev) => ({
      ...prev,
      [cleanEmail]: {
        selected: true,
        role: customRole,
        name: displayName,
      },
    }));

    setCustomEmail("");
    setErrorMessage("");
  };

  const activeSelections = Object.entries(selectedRecipients).filter(
    ([_, val]) => val.selected
  );

  const handleBatchShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSelections.length === 0) {
      setErrorMessage("Please select at least one collaborator to share with.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const recipientsPayload = activeSelections.map(([email, info]) => ({
        emailOrId: email,
        role: info.role,
      }));

      const result = await shareDocumentBatchAction(
        documentId,
        currentUserId,
        recipientsPayload
      );

      if (result.success) {
        const sharedNames = activeSelections.map(([_, info]) => info.name);
        const formattedSummary =
          sharedNames.length === 1
            ? sharedNames[0]
            : sharedNames.length === 2
            ? `${sharedNames[0]} and ${sharedNames[1]}`
            : `${sharedNames.slice(0, -1).join(", ")}, and ${sharedNames[sharedNames.length - 1]}`;

        setSelectedRecipients({});
        onSharesUpdated(formattedSummary);
        onClose();
      } else {
        setErrorMessage(result.error || "Failed to share document.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Revoke access for ${targetName}?`)) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await revokeDocumentShareAction(documentId, currentUserId, targetUserId);
      if (result.success) {
        setSuccessMessage(`Access revoked for ${targetName}.`);
        onSharesUpdated();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "Failed to revoke access.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revoke access.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Share "{documentTitle}"
              </h3>
              <p className="text-xs text-slate-500">
                Select one or more collaborators to grant view or edit access
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

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add People Section (Owner only) */}
          {isOwner ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Collaborators to Share With
                </label>
                {activeSelections.length > 0 && (
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {activeSelections.length} selected
                  </span>
                )}
              </div>

              {/* Demo users selection list */}
              {availableUsers.length > 0 ? (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {availableUsers.map((u) => {
                    const isChecked = !!selectedRecipients[u.email]?.selected;
                    const userRole = selectedRecipients[u.email]?.role || "editor";

                    return (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                          isChecked
                            ? "bg-indigo-50/70 border-indigo-200 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUserSelection(u.email, u.name, "editor")}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${u.avatar || "bg-indigo-600"}`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                          </div>
                        </label>

                        {isChecked && (
                          <select
                            value={userRole}
                            onChange={(e) => updateUserRole(u.email, e.target.value as Role)}
                            className="text-xs px-2 py-1 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 ml-2"
                          >
                            <option value="editor">Can edit</option>
                            <option value="viewer">Can view</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  All available demo users are already shared on this document.
                </div>
              )}

              {/* Share Action Button */}
              <button
                type="button"
                onClick={handleBatchShare}
                disabled={isLoading || activeSelections.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sharing document...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {activeSelections.length > 0
                        ? `Share with ${activeSelections.length} Selected Collaborator${
                            activeSelections.length > 1 ? "s" : ""
                          }`
                        : "Select Collaborators Above to Share"}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Only the document owner ({ownerName}) can invite new collaborators.</span>
            </div>
          )}

          {/* People with Access List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              People With Access ({shares.length + 1})
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
              {/* Owner row */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">
                    {ownerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                      {ownerName}
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                        Owner
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{ownerEmail}</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">Owner</span>
              </div>

              {/* Shared Users */}
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 flex items-center justify-between hover:bg-white transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                      {share.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                        {share.user.name}
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium capitalize">
                          {share.role === "editor" ? "Can edit" : "Can view"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{share.user.email}</div>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(share.userId, share.user.name)}
                      disabled={isLoading}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={`Revoke access for ${share.user.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {shares.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No other collaborators have been granted access yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1.5 px-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Document Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
