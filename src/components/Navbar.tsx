import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Bell, Search, LogOut, User as UserIcon, Settings, Plus, Menu, X, ChevronDown, Terminal } from "lucide-react";
import api from "../api";
import { toast } from "./Toast";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadNotifications = async () => {
        try {
          const { data } = await api.get("/notifications");
          setUnreadCount(data.unreadCount || 0);
        } catch (err) {
          console.warn("Failed to fetch unread notifications count:", err);
        }
      };

      fetchUnreadNotifications();
      // Poll notifications every 45 seconds for real-time-feeling updates
      const interval = setInterval(fetchUnreadNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast("Logged out successfully.", "info");
      navigate("/");
    } catch (err) {
      toast("Logout failed.", "error");
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-40 glass-panel border-b border-white/5 h-16 flex items-center px-4 md:px-8 justify-between">
      {/* Brand Logo */}
      <Link to={isAuthenticated ? "/feed" : "/"} className="flex items-center space-x-3 clickable">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Terminal className="w-5.5 h-5.5 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-[#f8fafc]">
          DevConnect
        </span>
      </Link>

      {/* Global Search (Authenticated Desktop) */}
      {isAuthenticated && (
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative max-w-md w-full mx-8">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search developers, tech-stacks, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-10 pr-4 bg-white/5 border border-white/10 rounded-full text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
          />
        </form>
      )}

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center space-x-4">
        {isAuthenticated && user ? (
          <>
            {/* Quick Create Post Button */}
            <Link
              to="/feed?compose=true"
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all clickable"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </Link>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all clickable"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#05050a] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition-all clickable"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-white/10 object-cover"
                />
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel-heavy border border-white/10 shadow-2xl p-1.5 z-20">
                    <div className="px-3 py-2 border-b border-white/5 mb-1 text-left">
                      <p className="text-xs font-semibold text-gray-200">{user.name}</p>
                      <p className="text-[10px] text-gray-400">@{user.username}</p>
                    </div>
                    
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-left clickable"
                    >
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-left clickable"
                    >
                      <Settings className="w-4 h-4 text-violet-400" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 transition-all text-left clickable"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-6">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors clickable"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium rounded-full transition-all duration-300 backdrop-blur-md clickable"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Toggle */}
      <div className="flex md:hidden items-center space-x-3">
        {isAuthenticated && (
          <Link to="/notifications" className="relative p-2 text-gray-300">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            )}
          </Link>
        )}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all clickable"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-16 inset-x-0 glass-panel-heavy border-b border-white/10 p-5 md:hidden flex flex-col gap-4 z-40 shadow-2xl animate-fade-in">
          {isAuthenticated ? (
            <>
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex items-center relative w-full">
                <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search DevConnect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-full text-sm text-gray-200"
                />
              </form>

              {/* Mobile Links */}
              <div className="flex flex-col gap-2">
                <Link
                  to="/feed"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300"
                >
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-medium">Developer Feed</span>
                </Link>
                <Link
                  to={`/profile/${user?.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300"
                >
                  <UserIcon className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium">My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300"
                >
                  <Settings className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-medium">Account Settings</span>
                </Link>
              </div>

              {/* Compose and Sign Out buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2 border-t border-white/5 pt-4">
                <Link
                  to="/feed?compose=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 bg-indigo-600 text-white rounded-full text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="h-10 border border-white/10 text-rose-400 rounded-full text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-full border border-white/10 text-center text-gray-200 rounded-full text-sm font-medium flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-center text-white rounded-full text-sm font-medium flex items-center justify-center"
              >
                Join DevConnect
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
