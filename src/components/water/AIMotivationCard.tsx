'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";

interface AIMotivationCardProps {
  motivation: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function AIMotivationCard({ motivation, isLoading, onRefresh }: AIMotivationCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Lightbulb className="h-7 w-7 text-primary" />
          AI Wisdom
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[80px] flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>A little boost to keep you going...</span>
            </div>
          ) : motivation ? (
            <p className="text-sm text-foreground leading-relaxed">
              {motivation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Click below to get personalized hydration motivation!
            </p>
          )}
        </div>

        <Button 
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full"
          variant="primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              New Motivation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}