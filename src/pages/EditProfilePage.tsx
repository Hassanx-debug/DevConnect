import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "../components/Toast";
import api from "../api";
import { motion } from "motion/react";
import { User, Tag, Github, Linkedin, Eye, Check, X, ArrowLeft, Terminal } from "lucide-react";

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatarUrl || "");
      setBio(user.bio || "");
      setTechStack(user.techStack ? user.techStack.join(", ") : "");
      setGithubUrl(user.githubUrl || "");
      setLinkedinUrl(user.linkedinUrl || "");
      setIsPrivate(user.isPrivate || false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const techStackArray = techStack
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await updateUser({
        name,
        avatarUrl,
        bio,
        techStack: techStackArray,
        githubUrl,
        linkedinUrl,
        isPrivate
      });

      toast("Stack card configured successfully!", "success");
      navigate(`/profile/${user?.username}`);
    } catch (err) {
      toast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
    toast("New identicon seed injected! Press Save to commit.", "info");
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto text-left">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white mb-6 clickable"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Profile</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-heavy rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative"
      >
        <h2 className="text-xl font-bold font-display text-white mb-2 flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Configure Stack Card</span>
        </h2>
        <p className="text-xs text-gray-400 mb-8">Deploy custom assets and parameters to your developer card coordinates.</p>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar configure */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/5 mb-2">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/20"
              alt="Avatar preview"
            />
            <div className="space-y-2 text-center sm:text-left flex-1 w-full">
              <label className="text-xs font-semibold text-gray-300 block">Avatar Asset URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 h-10 px-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  className="h-10 px-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl text-[10px] font-semibold text-gray-300 clickable"
                >
                  Generate Seed
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Tech Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expertise Stack (comma-separated)</span>
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, TypeScript, Rust, Go"
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Full stack engineer specialized in visual interaction, high-throughput backend services, and modular components..."
              rows={3}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Github Url */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Github className="w-3.5 h-3.5 text-gray-400" />
                <span>GitHub Repository Link</span>
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Linkedin Url */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn Corporate Link</span>
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Private profile toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="space-y-0.5 text-left">
              <p className="text-xs font-bold text-gray-200 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-violet-400" />
                <span>Private Profile coordinates</span>
              </p>
              <p className="text-[10px] text-gray-400 leading-normal">
                If active, only approved followed developers can locate your broadcasts stream.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all ${
                isPrivate ? "bg-cyan-500" : "bg-gray-700"
              }`}
            >
              <div
                className={`bg-black w-5 h-5 rounded-full shadow transform transition-all duration-250 ${
                  isPrivate ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 h-11 border border-white/10 hover:border-white/20 text-xs text-gray-300 font-semibold rounded-xl flex items-center space-x-1 transition-all clickable"
            >
              <X className="w-4 h-4" />
              <span>Discard Changes</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-white font-semibold rounded-xl text-xs flex items-center space-x-1 shadow-lg shadow-indigo-500/10 clickable"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Commit Stack Changes</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
