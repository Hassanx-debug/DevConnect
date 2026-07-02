import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import { User } from "../types";
import { TrendingUp, Users, MessageSquare, Terminal, Hash, Plus, Check } from "lucide-react";
import { toast } from "./Toast";

interface SidebarProps {
  onSelectTag?: (tag: string | null) => void;
  selectedTag?: string | null;
}

export default function Sidebar({ onSelectTag, selectedTag }: SidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const popularTags = ["React", "TypeScript", "Node.js", "MongoDB", "Three.js", "TailwindCSS", "Next.js", "Rust", "Go"];

  const fetchSidebarData = async () => {
    try {
      const statsRes = await api.get("/stats");
      setStats(statsRes.data);

      if (isAuthenticated) {
        const suggRes = await api.get("/users/suggested");
        setSuggestions(suggRes.data);
      }
    } catch (err) {
      console.warn("Failed to load sidebar metrics/suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, [isAuthenticated]);

  const handleFollow = async (targetId: string, name: string) => {
    try {
      await api.post(`/users/follow/${targetId}`);
      toast(`You are now following ${name}!`, "success");
      // Update suggestions list locally
      setSuggestions((prev) => prev.filter((u) => u.id !== targetId));
    } catch (err) {
      toast("Failed to follow developer.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DISCOVER TAGS CARD */}
      <div className="glass-card rounded-2xl p-5 text-left border border-white/5">
        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center space-x-2 font-display">
          <Hash className="w-4 h-4 text-cyan-400" />
          <span>Trending Technologies</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {onSelectTag ? (
            <>
              <button
                onClick={() => onSelectTag(null)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all border clickable ${
                  !selectedTag
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 font-semibold"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                All Tech
              </button>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all border clickable ${
                    selectedTag === tag
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 font-semibold"
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </>
          ) : (
            popularTags.map((tag) => (
              <Link
                key={tag}
                to={`/feed?tag=${encodeURIComponent(tag)}`}
                className="text-xs px-3 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-lg transition-all clickable"
              >
                #{tag}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* 2. SUGGESTED DEVELOPERS CARD (Authenticated only) */}
      {isAuthenticated && suggestions.length > 0 && (
        <div className="glass-card rounded-2xl p-5 text-left border border-white/5">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center space-x-2 font-display">
            <Users className="w-4 h-4 text-violet-400" />
            <span>Connect with Developers</span>
          </h3>
          <div className="space-y-4">
            {suggestions.map((sugg) => (
              <div key={sugg.id} className="flex items-center justify-between space-x-3">
                <Link to={`/profile/${sugg.username}`} className="flex items-center space-x-3 clickable">
                  <img
                    src={sugg.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${sugg.username}`}
                    alt={sugg.name}
                    className="w-10 h-10 rounded-full border border-white/10 object-cover"
                  />
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate hover:text-cyan-400 transition-colors">
                      {sugg.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">@{sugg.username}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleFollow(sugg.id, sugg.name)}
                  className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white rounded-lg border border-cyan-500/20 hover:border-cyan-500 transition-all text-xs clickable"
                  title="Follow Developer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PLATFORM METRICS CARD */}
      <div className="glass-card rounded-2xl p-5 text-left border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 radial-glow opacity-30 pointer-events-none" />
        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center space-x-2 font-display">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>DevConnect Status</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <Users className="w-4 h-4 text-cyan-400 mb-1" />
            <p className="text-xs text-gray-400">Devs</p>
            <p className="text-sm font-bold text-white mt-0.5">{stats.totalUsers}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <Terminal className="w-4 h-4 text-violet-400 mb-1" />
            <p className="text-xs text-gray-400">Posts</p>
            <p className="text-sm font-bold text-white mt-0.5">{stats.totalPosts}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <MessageSquare className="w-4 h-4 text-emerald-400 mb-1" />
            <p className="text-xs text-gray-400">Replies</p>
            <p className="text-sm font-bold text-white mt-0.5">{stats.totalComments}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
