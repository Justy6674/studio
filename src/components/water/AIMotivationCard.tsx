'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles, RefreshCw } from "lucide-react";

interface AIMotivationCardProps {
  motivation: string | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function AIMotivationCard({ motivation, loading, onRefresh }: AIMotivationCardProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-hydration-400/20 rounded-lg">
            <Sparkles className="h-6 w-6 text-hydration-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200">AI Motivation</h3>
        </div>
        <Button 
          onClick={onRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-slate-700 border-slate-600 hover:bg-slate-600"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Motivation Content */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-hydration-500/10 to-brown-500/10 border border-slate-600/50 min-h-[120px] flex items-center">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 w-full justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-hydration-400" />
            <span className="text-lg">Generating personalized motivation...</span>
          </div>
        ) : motivation ? (
          <p className="text-lg text-slate-200 leading-relaxed font-medium text-center">
            {motivation}
          </p>
        ) : (
          <p className="text-lg text-slate-400 italic text-center">
            Click the refresh button to get personalized AI motivation! 💧
          </p>
        )}
      </div>
    </div>
  );
}