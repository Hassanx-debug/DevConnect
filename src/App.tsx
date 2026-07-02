import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import FeedPage from "./pages/FeedPage";
import PostDetailPage from "./pages/PostDetailPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

// Components
import Navbar from "./components/Navbar";
import CustomCursor from "./components/CustomCursor";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Custom magnetic visual cursor */}
        <CustomCursor />

        {/* Global Navigation bar */}
        <Navbar />

        {/* Main Routing Layout */}
        <div className="min-h-screen bg-[#0a0a0f] text-[#f8fafc] font-sans selection:bg-blue-500/20 selection:text-blue-300 relative overflow-hidden">
          {/* Background Glow Orbs */}
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] sleek-glow-blue rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] sleek-glow-purple rounded-full pointer-events-none z-0" />
          
          <div className="relative z-10">
            <Routes>
              {/* Public Landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Platform routes */}
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/post/:id" element={<PostDetailPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/discover" element={<DiscoverPage />} />

              {/* Protected configuration and settings */}
              <Route
                path="/profile/:username/edit"
                element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Authentication screens */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Fallback 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
