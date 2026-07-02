import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { ProfileSkeleton } from "./Skeletons";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
