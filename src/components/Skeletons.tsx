import React from "react";

export function PostSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 mb-4 animate-shimmer">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-800/60 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-800/60 rounded w-1/4" />
          <div className="h-3 bg-gray-800/40 rounded w-1/6" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-800/60 rounded w-full" />
        <div className="h-4 bg-gray-800/60 rounded w-5/6" />
        <div className="h-4 bg-gray-800/40 rounded w-2/3" />
      </div>
      <div className="flex space-x-3 mt-4">
        <div className="h-6 bg-gray-800/40 rounded w-16" />
        <div className="h-6 bg-gray-800/40 rounded w-16" />
      </div>
      <div className="h-10 bg-gray-800/20 rounded-xl mt-6 w-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="w-full space-y-8 animate-shimmer">
      <div className="glass-panel-heavy rounded-3xl p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
          <div className="w-28 h-28 bg-gray-800/60 rounded-full mb-4 md:mb-0" />
          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="h-6 bg-gray-800/60 rounded w-1/3 mx-auto md:mx-0" />
            <div className="h-4 bg-gray-800/40 rounded w-1/4 mx-auto md:mx-0" />
            <div className="h-4 bg-gray-800/40 rounded w-1/2 mx-auto md:mx-0" />
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800/40 flex space-x-4">
          <div className="h-8 bg-gray-800/40 rounded w-20" />
          <div className="h-8 bg-gray-800/40 rounded w-20" />
        </div>
      </div>
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}
