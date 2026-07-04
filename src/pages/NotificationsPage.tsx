import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Notification } from "../types";
import { toast } from "../components/Toast";
import { Bell, BellOff, MessageSquare, Heart, UserPlus, Check, Trash2, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      toast("Failed to pull notifications stream.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn("Could not mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast("All alerts marked as read.", "success");
    } catch (err) {
      toast("Failed to update alerts.", "error");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-violet-400" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm glass-panel p-8 rounded-2xl border border-white/5">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Silo Access Denied</h3>
          <p className="text-xs text-gray-400">Please authenticate to access your notification stream coordinates.</p>
          <Link to="/login" className="block text-center py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 clickable">Unlock Terminal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto text-left">
      
      {/* Header action bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-white">Notifications</h2>
          <p className="text-xs text-gray-400">Alert coordinates dispatch center.</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-semibold text-gray-300 border border-white/5 hover:border-white/10 rounded-full flex items-center space-x-1 transition-all clickable"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <span className="w-8 h-8 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin inline-block" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 glass-card rounded-3xl text-center space-y-4 max-w-md mx-auto border border-white/5">
          <BellOff className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-md font-bold text-gray-300">Absolute Calm</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            No active alerts detected. When other developers like your broadcasts, reply to threads, or follow your card, you will see alerts here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`glass-card rounded-2xl p-4 border transition-all flex items-start gap-4 ${
                notif.isRead
                  ? "bg-white/[0.01] border-white/5 opacity-70"
                  : "bg-gradient-to-r from-cyan-500/5 to-transparent border-cyan-500/20 hover:border-cyan-500/35 cursor-pointer"
              }`}
            >
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0 text-left space-y-1">
                <div className="flex items-center space-x-2">
                  <Link to={`/profile/${notif.sender?.username}`} className="text-xs font-bold text-gray-200 hover:text-cyan-400 transition-colors clickable">
                    {notif.sender?.name || "Someone"}
                  </Link>
                  <span className="text-[10px] text-gray-500 font-mono">@{notif.sender?.username}</span>
                </div>
                
                <p className="text-xs text-gray-300">
                  {notif.type === "like" && "liked your broadcast."}
                  {notif.type === "comment" && "responded to your thread."}
                  {notif.type === "follow" && "connected and followed your stack card."}
                </p>

                {notif.post && (
                  <Link
                    to={`/post/${notif.post.id}`}
                    className="block text-[10px] text-cyan-400 hover:underline truncate pt-1 clickable"
                  >
                    Inspect Thread: "{notif.post.content}"
                  </Link>
                )}

                <p className="text-[9px] text-gray-500 pt-1">
                  {new Date(notif.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>

              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 self-center shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
