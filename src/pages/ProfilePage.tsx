import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import { User, Post } from "../types";
import { PostSkeleton } from "../components/Skeletons";
import { renderMarkdown } from "./FeedPage";
import { toast } from "../components/Toast";
import {
  Github,
  Linkedin,
  Calendar,
  Users,
  Grid,
  Info,
  Edit2,
  Trash2,
  Bookmark,
  Share2,
  ThumbsUp,
  MessageSquare,
  Lock,
  Terminal,
  ArrowRight,
  UserCheck,
  UserPlus,
  X
} from "lucide-react";
import { motion } from "motion/react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "about">("posts");
  const [loading, setLoading] = useState(true);

  // Follow Modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/profile/${username}`);
      setProfileUser(data);

      // Fetch profile posts
      const postsRes = await api.get("/posts", { params: { user: username } });
      setProfilePosts(postsRes.data);

      // Fetch saved posts if looking at own profile
      if (isAuthenticated && currentUser?.username === username.toLowerCase()) {
        const savedRes = await api.get("/posts", { params: { saved: "true" } });
        setSavedPosts(savedRes.data);
      }
    } catch (err) {
      toast("Profile not found.", "error");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast("Please sign in to connect.", "info");
      return;
    }
    if (!profileUser) return;

    const isFollowing = profileUser.isFollowing;
    
    // Optimistic UI update
    setProfileUser((prev) => {
      if (!prev) return null;
      const countAdjustment = isFollowing ? -1 : 1;
      return {
        ...prev,
        isFollowing: !isFollowing,
        followers: isFollowing
          ? prev.followers.filter((id) => id !== currentUser?.id)
          : [...prev.followers, currentUser?.id || ""]
      };
    });

    try {
      if (isFollowing) {
        await api.post(`/users/unfollow/${profileUser.id}`);
        toast(`Unfollowed @${profileUser.username}.`, "info");
      } else {
        await api.post(`/users/follow/${profileUser.id}`);
        toast(`Connected! Following @${profileUser.username}.`, "success");
      }
    } catch (err) {
      // Revert if error
      fetchProfileData();
    }
  };

  const openFollowersModal = async () => {
    if (!profileUser) return;
    try {
      const { data } = await api.get(`/users/${profileUser.id}/followers`);
      setFollowersList(data);
      setShowFollowersModal(true);
    } catch (err) {
      toast("Failed to load followers list.", "error");
    }
  };

  const openFollowingModal = async () => {
    if (!profileUser) return;
    try {
      const { data } = await api.get(`/users/${profileUser.id}/following`);
      setFollowingList(data);
      setShowFollowingModal(true);
    } catch (err) {
      toast("Failed to load following list.", "error");
    }
  };

  const isOwnProfile = currentUser?.username === username?.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] pt-24 px-4 max-w-4xl mx-auto space-y-6">
        <PostSkeleton />
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
      
      {/* 1. HERO BIO CARD (Glassmorphic Accent Overlay) */}
      <div className="glass-panel-heavy rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden text-left mb-8">
        {/* Glow corner blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
            <img
              src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profileUser.username}`}
              alt={profileUser.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-cyan-500/30 object-cover shadow-2xl"
            />
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white">{profileUser.name}</h2>
                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-cyan-400 font-mono">
                  @{profileUser.username}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md whitespace-normal">{profileUser.bio || "No biography provided yet."}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-400 pt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>Joined {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
                
                {/* Social networks linkages */}
                <div className="flex items-center space-x-3 text-gray-500">
                  {profileUser.githubUrl && (
                    <a href={profileUser.githubUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {profileUser.linkedinUrl && (
                    <a href={profileUser.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOLLOW / UNFOLLOW / EDIT PANEL */}
          <div className="shrink-0 flex gap-2">
            {isOwnProfile ? (
              <Link
                to={`/profile/${profileUser.username}/edit`}
                className="h-10 px-5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 hover:border-white/20 rounded-full flex items-center space-x-1.5 transition-all clickable"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure Profile</span>
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`h-10 px-6 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xl clickable ${
                  profileUser.isFollowing
                    ? "bg-white/10 text-white hover:bg-rose-500/10 hover:text-rose-400 border border-white/10 hover:border-rose-500/20"
                    : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/10"
                }`}
              >
                {profileUser.isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connect Stacks</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Followers following count bar */}
        <div className="flex gap-6 mt-8 pt-6 border-t border-white/5 justify-center md:justify-start">
          <button onClick={openFollowersModal} className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors clickable text-left">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-extrabold text-white">{profileUser.followers?.length || 0}</span>
            <span className="text-xs text-gray-400">Followers</span>
          </button>
          <button onClick={openFollowingModal} className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors clickable text-left">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-extrabold text-white">{profileUser.following?.length || 0}</span>
            <span className="text-xs text-gray-400">Following</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLLER BAR */}
      <div className="flex border-b border-white/5 mb-6 text-sm">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center space-x-1.5 clickable ${
            activeTab === "posts" ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Broadcasts ({profilePosts.length})</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center space-x-1.5 clickable ${
              activeTab === "saved" ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks ({savedPosts.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("about")}
          className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center space-x-1.5 clickable ${
            activeTab === "about" ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>About Stack</span>
        </button>
      </div>

      {/* 3. TAB VIEWS CONTENT STREAM */}
      <div className="space-y-4 text-left">
        {activeTab === "posts" && (
          profilePosts.length === 0 ? (
            <div className="p-12 glass-panel rounded-2xl text-center text-xs text-gray-500">
              No insights broadcasted yet.
            </div>
          ) : (
            profilePosts.map((post) => (
              <div key={post.id} className="glass-card rounded-2xl p-6 border border-white/5 relative">
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-normal break-words font-sans">
                  {renderMarkdown(post.content)}
                </div>
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/5 bg-black/30 mb-4">
                    <img src={post.imageUrl} alt="attachment" className="max-h-80 w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
                  <div className="flex space-x-4">
                    <span className="flex items-center space-x-1"><ThumbsUp className="w-3.5 h-3.5 text-cyan-400" /> <span>{post.likes?.length || 0}</span></span>
                    <Link to={`/post/${post.id}`} className="flex items-center space-x-1 hover:text-indigo-400"><MessageSquare className="w-3.5 h-3.5" /> <span>{post.commentCount || 0} Responses</span></Link>
                  </div>
                  <Link to={`/post/${post.id}`} className="text-xs text-cyan-400 hover:underline">View Thread →</Link>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "saved" && isOwnProfile && (
          savedPosts.length === 0 ? (
            <div className="p-12 glass-panel rounded-2xl text-center text-xs text-gray-500">
              No saved posts found. Hover feed items and click the bookmark ribbon to save posts here.
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post.id} className="glass-card rounded-2xl p-6 border border-white/5 relative">
                <div className="flex items-center space-x-2.5 mb-3">
                  <img src={post.author?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author?.username}`} className="w-7 h-7 rounded-full" alt="avatar" />
                  <span className="text-xs font-semibold text-gray-200">@{post.author?.username}</span>
                </div>
                <div className="text-sm text-gray-300 mb-4 whitespace-normal break-words font-sans">
                  {renderMarkdown(post.content)}
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3 text-gray-400">
                  <Link to={`/post/${post.id}`} className="text-cyan-400 hover:underline">Inspect Discussion Thread</Link>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "about" && (
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-200 mb-3 uppercase tracking-wider font-mono">Expertise Tech Stack</h3>
              {profileUser.techStack && profileUser.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileUser.techStack.map((tech) => (
                    <span key={tech} className="text-xs px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg">
                      #{tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No technology tags configured for this stack card.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-200 mb-2 uppercase tracking-wider font-mono font-display">Silo Privacy Coordinates</h3>
              <p className="text-xs text-gray-400">
                Profile Visibility: <span className="font-semibold text-emerald-400">{profileUser.isPrivate ? "Followers-Only Private Silo" : "Public Matrix Coordinate"}</span>
              </p>
            </div>
          </div>
        )}
      </div>


      {/* ==========================================
          4. FOLLOWERS LIST MODAL
         ========================================== */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel-heavy rounded-2xl border border-white/10 p-6 relative text-left">
            <button onClick={() => setShowFollowersModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white clickable">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-md font-bold font-display text-white mb-4">Followers ({followersList.length})</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {followersList.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No followers detected on this matrix coordinate.</p>
              ) : (
                followersList.map((fUser) => (
                  <div key={fUser.id} className="flex items-center justify-between">
                    <Link to={`/profile/${fUser.username}`} onClick={() => setShowFollowersModal(false)} className="flex items-center space-x-3 clickable">
                      <img src={fUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${fUser.username}`} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                      <div>
                        <p className="text-xs font-bold text-gray-200">{fUser.name}</p>
                        <p className="text-[10px] text-gray-400">@{fUser.username}</p>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          5. FOLLOWING LIST MODAL
         ========================================== */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel-heavy rounded-2xl border border-white/10 p-6 relative text-left">
            <button onClick={() => setShowFollowingModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white clickable">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-md font-bold font-display text-white mb-4">Following ({followingList.length})</h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {followingList.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">This developer isn't following anyone yet.</p>
              ) : (
                followingList.map((fUser) => (
                  <div key={fUser.id} className="flex items-center justify-between">
                    <Link to={`/profile/${fUser.username}`} onClick={() => setShowFollowingModal(false)} className="flex items-center space-x-3 clickable">
                      <img src={fUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${fUser.username}`} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
                      <div>
                        <p className="text-xs font-bold text-gray-200">{fUser.name}</p>
                        <p className="text-[10px] text-gray-400">@{fUser.username}</p>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
