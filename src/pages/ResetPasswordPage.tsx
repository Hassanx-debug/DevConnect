import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "../components/Toast";
import api from "../api";
import { motion } from "motion/react";
import { Key, ArrowLeft, RefreshCw, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast("Passwords do not match.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password, confirmPassword });
      toast("Password reset successful! You can now log in.", "success");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Token has expired or is invalid.";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden bg-grid pt-20">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel-heavy rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 text-left"
      >
        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg mx-auto">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">New Credentials</h2>
          <p className="text-xs text-gray-400">Set your secure developer password credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">New Password</label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Confirm New Password</label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 mt-2 clickable"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm New Credentials</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <Link to="/login" className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 clickable">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Terminal Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
