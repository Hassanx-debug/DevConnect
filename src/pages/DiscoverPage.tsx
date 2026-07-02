import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import { User, Post } from "../types";
import { renderMarkdown } from "./FeedPage";
import { toast } from "../components/Toast";
import { Search, UserPlus, UserCheck, Terminal, Hash, Flame, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function DiscoverPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"developers" | "broadcasts">("developers");
  
  const [devResults, setDevResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // Default suggested users on mount
  const loadInitialSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/suggested");
      setDevResults(data);
    } catch (err) {
      console.warn("Could not load trending developers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (activeTab === "developers") {
        loadInitialSuggestions();
      } else {
        // Fetch trending or latest posts
        api.get("/posts", { params: { type: "trending", limit: 6 } })
          .then((res) => setPostResults(res.data))
          .catch(() => {});
      }
    }
  }, [searchQuery, activeTab]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      if (activeTab === "developers") {
        const { data } = await api.get("/users/search", { params: { q: searchQuery } });
        setDevResults(data);
      } else {
        const { data } = await api.get("/posts", { params: { tag: searchQuery } }); // Search posts by tag
        setPostResults(data);
      }
    } catch (err) {
      toast("Query matrix lookup failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetId: string, idx: number) => {
    if (!isAuthenticated) {
      toast("Please sign in to connect.", "info");
      return;
    }

    const targetUser = devResults[idx];
    const isFollowing = targetUser.isFollowing;

    // Optimistic state
    setDevResults((prev) =>
      prev.map((u) => {
        if (u.id === targetId) return { ...u, isFollowing: !isFollowing };
        return u;
      })
    );

    try {
      if (isFollowing) {
        await api.post(`/users/unfollow/${targetId}`);
        toast(`Unfollowed @${targetUser.username}.`, "info");
      } else {
        await api.post(`/users/follow/${targetId}`);
        toast(`Connected with @${targetUser.username}!`, "success");
      }
    } catch (err) {
      // Revert on error
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold font-display text-white">Discovery Matrix</h2>
        <p className="text-xs text-gray-400">Query the platform to find technologies, broadcasts, or connect cards.</p>
      </div>

      {/* Unified Search Input bar */}
      <form onSubmit={handleSearch} className="relative flex items-center mb-6">
        <Search className="absolute left-4 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === "developers" ? "Search developers by name, username, bio, or tech stack..." : "Search broadcasts by tags (e.g. React)..."}
          className="w-full h-13 pl-12 pr-28 bg-white/5 border border-white/10 rounded-2xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 h-9 px-4 bg-cyan-500 text-black font-bold rounded-xl text-xs hover:bg-cyan-400 transition-colors clickable"
        >
          Query Matrix
        </button>
      </form>

      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 mb-6 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab("developers")}
          className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center space-x-1.5 clickable ${
            activeTab === "developers" ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Developers</span>
        </button>

        <button
          onClick={() => setActiveTab("broadcasts")}
          className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center space-x-1.5 clickable ${
            activeTab === "broadcasts" ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Tag Broadcasts</span>
        </button>
      </div>

      {/* Search results */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="w-8 h-8 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin inline-block" />
          <p className="text-xs text-gray-500 mt-2">Querying database nodes...</p>
        </div>
      ) : activeTab === "developers" ? (
        devResults.length === 0 ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-xs text-gray-500">
            No developers matched your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devResults.map((dev, idx) => (
              <div key={dev.id} className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between relative group hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <Link to={`/profile/${dev.username}`} className="flex items-center space-x-3 clickable">
                    <img
                      src={dev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${dev.username}`}
                      alt={dev.name}
                      className="w-12 h-12 rounded-full border border-white/10 object-cover"
                    />
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">{dev.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">@{dev.username}</p>
                    </div>
                  </Link>

                  {currentUser?.id !== dev.id && (
                    <button
                      onClick={() => handleFollowToggle(dev.id, idx)}
                      className={`p-1.5 rounded-lg border text-xs transition-all clickable ${
                        dev.isFollowing
                          ? "bg-white/10 border-white/10 text-white hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/25"
                          : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-500"
                      }`}
                    >
                      {dev.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 mt-3 mb-4">{dev.bio || "No biography configured."}</p>

                {dev.techStack && dev.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1 border-t border-white/[0.03] pt-3">
                    {dev.techStack.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 text-gray-400 rounded">
                        {tech}
                      </span>
                    ))}
                    {dev.techStack.length > 3 && (
                      <span className="text-[9px] text-gray-500 px-1 pt-0.5">+{dev.techStack.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        postResults.length === 0 ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-xs text-gray-500">
            No tag broadcasts match. Try typing tag names like "React" or "TypeScript".
          </div>
        ) : (
          <div className="space-y-4">
            {postResults.map((post) => (
              <div key={post.id} className="glass-card rounded-2xl p-6 border border-white/5">
                <div className="flex items-center space-x-2.5 mb-3">
                  <img src={post.author?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author?.username}`} className="w-7 h-7 rounded-full" alt="avatar" />
                  <span className="text-xs font-semibold text-gray-200">@{post.author?.username}</span>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-normal break-words font-sans">
                  {renderMarkdown(post.content)}
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3 text-gray-400">
                  <Link to={`/post/${post.id}`} className="text-cyan-400 hover:underline">Inspect Discussion Thread</Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
