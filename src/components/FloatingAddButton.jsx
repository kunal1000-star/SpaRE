import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

export default function FloatingAddButton({ onClick }) {
  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 group animate-pop-in">
      {/* Ambient Pulsing Glow Effect behind button */}
      <div className="absolute -inset-1.5 bg-white/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 animate-pulse-glow" />

      {/* Main Floating Button */}
      <button
        type="button"
        onClick={onClick}
        className="relative flex items-center space-x-2.5 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-2xl shadow-white/20 hover:shadow-white/40 border border-white/40 transition-all duration-300 hover:scale-105 active:scale-95 light-sweep cursor-pointer"
        aria-label="Add New Topic"
        title="Add New Topic to Revision Schedule"
      >
        {/* Animated Plus Icon */}
        <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center backdrop-blur-sm group-hover:rotate-90 group-hover:bg-black/20 transition-all duration-300">
          <Plus className="w-4 h-4 text-black" strokeWidth={3} />
        </div>

        {/* Button Label */}
        <span className="tracking-wide font-extrabold text-[13px] sm:text-sm">
          Add Topic
        </span>

        {/* Small Sparkle Accent */}
        <Sparkles className="w-3.5 h-3.5 text-zinc-600 animate-pulse hidden sm:inline" />
      </button>
    </div>
  );
}
