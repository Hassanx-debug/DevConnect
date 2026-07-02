import React from "react";
import { Link } from "react-router-dom";
import { Terminal, ArrowRight, ShieldAlert } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 bg-grid pt-20">
      <div className="max-w-md w-full glass-card p-10 rounded-3xl border border-white/5 text-center space-y-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center rounded-2xl mx-auto shadow-lg shadow-red-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold font-display text-white">404 Void</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Coordinate Not Found</p>
        </div>

        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
          The grid coordinates you requested do not point to any active platform nodes or deployment branches. Return to the core feed matrix.
        </p>

        <Link
          to="/"
          className="inline-flex h-11 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl items-center justify-center space-x-1.5 shadow-lg shadow-blue-500/10 clickable"
        >
          <span>Return to core terminal</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    </div>
  );
}
