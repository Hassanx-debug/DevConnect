import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "../components/Toast";
import { motion } from "motion/react";
import { Terminal, User, Mail, Key, Sparkles, Check } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, username, email, password, confirmPassword } = formData;

    if (!name || !username || !email || !password || !confirmPassword) {
      toast("Please fill in all fields.", "error");
      return;
    }

    if (username.length < 3) {
      toast("Username must be at least 3 characters.", "error");
      return;
    }

    if (password.length < 6) {
      toast("Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
      });

      toast("Account registered! Welcome to the matrix.", "success");
      navigate("/feed");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Registration failed. Username/Email may already exist.";
      toast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden bg-grid pt-24 pb-12">
      {/* Glow overlays */}
      <div className="absolute top-[10%] right-[10%] w-80 h-80 rounded-full bg-cyan-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-80 h-80 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full glass-panel-heavy rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 text-left"
      >
        {/* Registration Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Initialize Stack Card</h2>
          <p className="text-xs text-gray-400">Join a global network of hyper-collaborative developers</p>
        </div>

        {/* Form fields */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Display Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Username</label>
              <div className="relative flex items-center">
                <Terminal className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ada_coder"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@devconnect.com"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <div className="relative flex items-center">
                <Key className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Confirm Password</label>
              <div className="relative flex items-center">
                <Key className="absolute left-3 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start space-x-2.5 mt-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-normal">
              By launching your stack card, you align with open-source development and multi-stack tags matching matrices.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50 mt-4 clickable"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Compile Account Registry</span>
              </>
            )}
          </button>
        </form>

        {/* Existing login link */}
        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-400">
            Already have a DevConnect card?{" "}
            <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors clickable">
              Unlock Terminal
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
