import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "../components/Toast";
import { motion } from "motion/react";
import { LogIn, Key, Mail, Terminal, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please fill in all fields.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast("Successfully signed in! Welcome back.", "success");
      const redirectTo = searchParams.get("redirect") || "/feed";
      navigate(redirectTo);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Invalid email or password. Please try again.";
      toast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden bg-grid pt-20">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[20%] left-[20%] w-72 h-72 rounded-full bg-cyan-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full glass-panel-heavy rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 text-left"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">DevConnect Terminal</h2>
          <p className="text-xs text-gray-400">Initialize authentication session to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input */}
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
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-all clickable">
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-gray-300 transition-colors clickable"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50 clickable"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-400">
            First time in DevConnect?{" "}
            <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors clickable">
              Build your connection card
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
