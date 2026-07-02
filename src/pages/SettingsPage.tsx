import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { toast } from "../components/Toast";
import api from "../api";
import { motion } from "motion/react";
import { Shield, Key, Trash2, Eye, ShieldAlert, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast("Please complete all password fields.", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast("Passwords do not match.", "error");
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post("/users/change-password", {
        currentPassword,
        newPassword
      });

      toast("Credentials changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid current credentials.";
      toast(msg, "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccountCascading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== user?.username) {
      toast("Username confirmation string mismatch.", "error");
      return;
    }

    if (!window.confirm("CRITICAL WARNING: This action is permanent and deletes your account, all posts, comments, relationships, and notification records. Are you absolutely sure?")) {
      return;
    }

    setDeletingAccount(true);
    try {
      await api.delete("/users/me/delete-account");
      toast("Account cascading deletion finalized. Disconnecting session...", "info");
      logout();
      navigate("/");
    } catch (err) {
      toast("Failed to process account deletion.", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto text-left space-y-6">
      
      {/* Page Title */}
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold font-display text-white">System Settings</h2>
        <p className="text-xs text-gray-400">Configure credentials, privacy policies, and security silos.</p>
      </div>

      {/* 1. UPDATE SECURITY CREDENTIALS */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-gray-200 flex items-center space-x-2 font-display">
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Security Credentials</span>
        </h3>
        <p className="text-xs text-gray-400">Update your account authentication token/password.</p>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="px-5 h-10 bg-cyan-500 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 hover:bg-cyan-400 disabled:opacity-50 clickable ml-auto"
          >
            {updatingPassword ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save New Credentials</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. CASCADING ACCOUNT DELETION */}
      <div className="glass-card rounded-2xl p-6 border border-rose-500/10 bg-rose-500/[0.01] space-y-4">
        <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2 font-display">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Danger Silo Area</span>
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Deleting your profile is irreversible. It cascades through our database nodes, fully purging all:
        </p>
        <ul className="list-disc pl-5 text-[10px] text-gray-400 space-y-1 leading-normal">
          <li>Account credentials and social links</li>
          <li>Broadcast feed posts and image references</li>
          <li>Recursive comment responses</li>
          <li>Active connection nodes (Followers & Following structures)</li>
          <li>Central alert/notification histories</li>
        </ul>

        <form onSubmit={handleDeleteAccountCascading} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Confirm username <span className="font-mono text-rose-400">"{user?.username}"</span> to proceed:
            </label>
            <input
              type="text"
              required
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={user?.username}
              className="w-full h-10 px-4 bg-red-500/5 border border-rose-500/15 focus:border-rose-500 rounded-xl text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={deletingAccount || deleteConfirmText !== user?.username}
            className="px-5 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-30 transition-all clickable ml-auto"
          >
            {deletingAccount ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Erase My Account Permanently</span>
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
