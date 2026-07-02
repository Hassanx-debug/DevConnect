import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "../components/Toast";
import api from "../api";
import { motion } from "motion/react";
import { Mail, Terminal, ArrowLeft, RefreshCw, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      toast("Password reset link generated successfully!", "success");
      if (data.resetUrl) {
        setResetUrl(data.resetUrl); // For easy testing inside sandbox!
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create reset request.";
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
          <h2 className="text-2xl font-bold font-display text-white">Reset Credentials</h2>
          <p className="text-xs text-gray-400">Request password token dispatch</p>
        </div>

        {!resetUrl ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@devconnect.com"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 clickable"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Request Reset Link</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-2xl text-xs text-cyan-300 leading-relaxed text-left">
              <p className="font-bold mb-1">💡 Developer Simulation Mode Enabled:</p>
              <p className="mb-3">
                Since we are in a sandbox container, a direct reset URL has been generated for you to test instantly:
              </p>
              <a
                href={resetUrl}
                className="block text-center py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-xs break-all"
              >
                Go to Reset Password screen
              </a>
            </div>
            <p className="text-xs text-gray-400">Or use the dispatch to request another email address.</p>
          </div>
        )}

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
