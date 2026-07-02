import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Post } from "../types";
import Sidebar from "../components/Sidebar";
import { PostSkeleton } from "../components/Skeletons";
import { toast } from "../components/Toast";
import {
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Share2,
  Image,
  Tag,
  Eye,
  Terminal,
  Trash2,
  Edit3,
  Sparkles,
  ChevronDown,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Simple custom Regex Markdown parser helper to render basic markdown in feeds/detail safely!
export function renderMarkdown(content: string) {
  if (!content) return "";
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Inline Code
  html = html.replace(/`(.*?)`/g, "<code class='bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs'>$1</code>");
  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre class='bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-gray-300 my-3 overflow-x-auto leading-relaxed'>$1</pre>");
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-cyan-400 hover:underline'>$1</a>");
  // Paragraph linebreaks
  html = html.replace(/\n/g, "<br />");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [feedType, setFeedType] = useState<"latest" | "following" | "trending">("latest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Composer states
  const [showCompose, setShowCompose] = useState(false);
  const [composeContent, setComposeContent] = useState("");
  const [composeTags, setComposeTags] = useState("");
  const [composeImage, setComposeImage] = useState("");
  const [previewActive, setPreviewActive] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Edit states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    // Sync query params (compose modal or tags)
    const openCompose = searchParams.get("compose") === "true";
    const tagFilter = searchParams.get("tag");

    if (openCompose && isAuthenticated) setShowCompose(true);
    if (tagFilter) setSelectedTag(tagFilter);

    fetchPosts(1, feedType, tagFilter);
  }, [searchParams, feedType, isAuthenticated]);

  const fetchPosts = async (pageNum: number, type: typeof feedType, tag: string | null = selectedTag, loadMore = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await api.get("/posts", {
        params: {
          type,
          page: pageNum,
          limit: 8,
          tag: tag || undefined
        }
      });

      if (loadMore) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }

      setHasMore(data.length === 8);
      setPage(pageNum);
    } catch (err) {
      toast("Failed to load feed posts.", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSelectTag = (tag: string | null) => {
    setSelectedTag(tag);
    setPage(1);
    if (tag) {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
    fetchPosts(1, feedType, tag);
  };

  const handleFeedTypeChange = (type: typeof feedType) => {
    if (type === "following" && !isAuthenticated) {
      toast("Please sign in to view posts from developers you follow.", "info");
      navigate("/login?redirect=/feed");
      return;
    }
    setFeedType(type);
    setPage(1);
    fetchPosts(1, type, selectedTag);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeContent.trim()) {
      toast("Post content cannot be empty.", "error");
      return;
    }

    setSubmittingPost(true);
    try {
      const tagsArray = composeTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { data } = await api.post("/posts", {
        content: composeContent,
        techTags: tagsArray,
        imageUrl: composeImage
      });

      toast("Your stack post has been broadcasted!", "success");
      setComposeContent("");
      setComposeTags("");
      setComposeImage("");
      setPreviewActive(false);
      setShowCompose(false);
      
      // Clean up search param
      searchParams.delete("compose");
      setSearchParams(searchParams);

      // Prepend to posts list
      setPosts((prev) => [data, ...prev]);
    } catch (err) {
      toast("Failed to publish post.", "error");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      toast("Sign in to like and engage with posts.", "info");
      return;
    }

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = p.likedByMe;
          const updatedLikes = isLiked
            ? p.likes.filter((id) => id !== user?.id)
            : [...p.likes, user?.id || ""];
          return {
            ...p,
            likedByMe: !isLiked,
            likes: updatedLikes
          };
        }
        return p;
      })
    );

    try {
      const post = posts.find((p) => p.id === postId);
      if (post?.likedByMe) {
        await api.post(`/posts/${postId}/unlike`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    } catch (err) {
      // Revert if error
      fetchPosts(page, feedType, selectedTag, false);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!isAuthenticated) {
      toast("Sign in to bookmark/save posts.", "info");
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, bookmarkedByMe: !p.bookmarkedByMe };
        }
        return p;
      })
    );

    try {
      const post = posts.find((p) => p.id === postId);
      if (post?.bookmarkedByMe) {
        await api.post(`/posts/${postId}/unbookmark`);
        toast("Post removed from saved list.", "info");
      } else {
        await api.post(`/posts/${postId}/bookmark`);
        toast("Post saved to bookmarks!", "success");
      }
    } catch (err) {
      // Revert
      fetchPosts(page, feedType, selectedTag, false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this broadcast? This cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      toast("Post deleted successfully.", "info");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      toast("Failed to delete post.", "error");
    }
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      const { data } = await api.patch(`/posts/${postId}`, { content: editContent });
      toast("Post updated successfully.", "success");
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, content: editContent };
          }
          return p;
        })
      );
      setEditingPostId(null);
    } catch (err) {
      toast("Failed to edit post.", "error");
    }
  };

  const triggerPostShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    toast("Link copied to clipboard! Share with developers.", "success");
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: POST FEED & CONTROLS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Feed Filter Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
            <div className="flex space-x-1.5 w-full sm:w-auto">
              {(["latest", "following", "trending"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFeedTypeChange(type)}
                  className={`flex-1 sm:flex-none text-xs px-4 py-2.5 rounded-xl font-medium capitalize transition-all clickable ${
                    feedType === type
                      ? "bg-white/10 text-white font-semibold shadow"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {type} Feed
                </button>
              ))}
            </div>

            {selectedTag && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs">
                <span>Filtering: #{selectedTag}</span>
                <button onClick={() => handleSelectTag(null)} className="hover:text-white clickable">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* COMPOSE QUICK BTN (If not visible) */}
          {isAuthenticated && !showCompose && (
            <button
              onClick={() => setShowCompose(true)}
              className="w-full p-4 glass-panel border border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-300 rounded-2xl flex items-center justify-between transition-all text-sm clickable"
            >
              <div className="flex items-center space-x-3 text-left">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border border-white/10 object-cover"
                />
                <span>Share a code insight, tag technologies, or build networks...</span>
              </div>
              <Terminal className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {/* EXPANDABLE COMPOSER BLOCK */}
          <AnimatePresence>
            {showCompose && isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowCompose(false);
                    searchParams.delete("compose");
                    setSearchParams(searchParams);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white clickable"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center space-x-2 font-display">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Broadcast insight to feed</span>
                </h3>

                <form onSubmit={handleCreatePost} className="space-y-4 text-left">
                  {/* Content area */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-mono">Supports raw text & Markdown syntax</span>
                      <button
                        type="button"
                        onClick={() => setPreviewActive(!previewActive)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 clickable"
                      >
                        {previewActive ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{previewActive ? "Editor" : "Markdown Preview"}</span>
                      </button>
                    </div>

                    {previewActive ? (
                      <div className="min-h-[140px] w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm text-gray-300 overflow-y-auto leading-relaxed">
                        {composeContent ? renderMarkdown(composeContent) : <p className="text-gray-500 italic">Preview window empty...</p>}
                      </div>
                    ) : (
                      <textarea
                        required
                        value={composeContent}
                        onChange={(e) => setComposeContent(e.target.value)}
                        placeholder="Write something cool... Wrap code blocks with triple backticks (```) or bold text with **bold**."
                        rows={5}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tech tag input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Technology tags (comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={composeTags}
                        onChange={(e) => setComposeTags(e.target.value)}
                        placeholder="React, TypeScript, Next.js"
                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    {/* Image Mock Upload link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                        <Image className="w-3.5 h-3.5 text-violet-400" />
                        <span>Mock Screenshot / Image URL</span>
                      </label>
                      <input
                        type="url"
                        value={composeImage}
                        onChange={(e) => setComposeImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="h-11 px-6 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50 clickable ml-auto"
                  >
                    {submittingPost ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Broadcast Stack Insight</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN POST FEED STREAM */}
          {loading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 border border-white/5 text-center space-y-4 max-w-xl mx-auto">
              <Terminal className="w-12 h-12 text-violet-500/50 mx-auto" />
              <h3 className="text-lg font-bold text-gray-200">Terminal Void</h3>
              <p className="text-sm text-gray-400">
                No active broadcasts found on this matrix coordinate. Try changing filter sets or broadcasting your first post!
              </p>
              <button
                onClick={() => {
                  setFeedType("latest");
                  setSelectedTag(null);
                  setSearchParams({});
                  fetchPosts(1, "latest", null);
                }}
                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-xs text-white clickable"
              >
                Reset Feed Matrix
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="glass-card rounded-2xl p-6 border border-white/5 text-left relative group hover:border-white/10 transition-all"
                >
                  {/* Post author block */}
                  <div className="flex justify-between items-start mb-4">
                    <Link to={`/profile/${post.author?.username}`} className="flex items-center space-x-3 clickable">
                      <img
                        src={post.author?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author?.username}`}
                        alt={post.author?.name}
                        className="w-11 h-11 rounded-full border border-white/10 object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-200 hover:text-cyan-400 transition-colors">
                            {post.author?.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-gray-400 font-mono">
                            @{post.author?.username}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </Link>

                    {/* Quick options: Edit or Delete */}
                    {isAuthenticated && user?.id === (post.author?.id || post.author) && (
                      <div className="flex space-x-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditContent(post.content);
                          }}
                          className="p-1.5 text-gray-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 clickable"
                          title="Edit Broadcast"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 clickable"
                          title="Delete Broadcast"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit mode vs Render mode */}
                  {editingPostId === post.id ? (
                    <div className="space-y-3 my-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200"
                        rows={4}
                      />
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg clickable"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdatePost(post.id)}
                          className="px-4 py-1.5 text-xs bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 clickable"
                        >
                          Save changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Rich Content rendering */}
                      <div className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-normal break-words font-sans">
                        {renderMarkdown(post.content)}
                      </div>

                      {/* Optional Post Image */}
                      {post.imageUrl && (
                        <div className="mb-4 rounded-xl border border-white/5 overflow-hidden bg-black/40">
                          <img
                            src={post.imageUrl}
                            alt="Broadcast attachment"
                            className="max-h-96 w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Post tags */}
                  {post.techTags && post.techTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {post.techTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSelectTag(tag)}
                          className="text-[10px] px-2 py-1 bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 rounded text-gray-400 border border-white/5 transition-colors clickable"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Post engagement footer bar */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-gray-400">
                    <div className="flex space-x-5">
                      {/* Likes count with dynamic icons */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1.5 transition-colors clickable ${
                          post.likedByMe ? "text-cyan-400 font-semibold" : "hover:text-cyan-400"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.likedByMe ? "fill-cyan-400/20" : ""}`} />
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      {/* Comments trigger */}
                      <Link
                        to={`/post/${post.id}`}
                        className="flex items-center space-x-1.5 hover:text-indigo-400 transition-colors clickable"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentCount || 0} Replies</span>
                      </Link>
                    </div>

                    <div className="flex space-x-3">
                      {/* Saved/Bookmarks */}
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`transition-colors clickable ${
                          post.bookmarkedByMe ? "text-yellow-400" : "hover:text-yellow-400"
                        }`}
                        title="Bookmark Broadcast"
                      >
                        <Bookmark className={`w-4 h-4 ${post.bookmarkedByMe ? "fill-yellow-400/20" : ""}`} />
                      </button>

                      {/* Share link copy */}
                      <button
                        onClick={() => triggerPostShare(post.id)}
                        className="hover:text-cyan-400 transition-colors clickable"
                        title="Copy Broadcast Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INFINITE SCROLL / LOAD MORE TRIGGERS */}
          {hasMore && !loading && (
            <div className="pt-4 pb-12 text-center">
              <button
                onClick={() => fetchPosts(page + 1, feedType, selectedTag, true)}
                disabled={loadingMore}
                className="h-11 px-8 border border-white/10 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-cyan-300 rounded-full font-semibold transition-all flex items-center gap-2 mx-auto disabled:opacity-50 clickable"
              >
                {loadingMore ? (
                  <>
                    <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    <span>Connecting Feed Packets...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Load More Insights</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: METRICS AND RECOMMENDATIONS */}
        <div className="lg:col-span-4 hidden lg:block">
          <Sidebar onSelectTag={handleSelectTag} selectedTag={selectedTag} />
        </div>

      </div>
    </div>
  );
}
