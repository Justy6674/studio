"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
          <Lightbulb className="h-7 w-7 text-yellow-400" />
          AI Wisdom
        </CardTitle>
        <CardDescription>A little boost to keep you going!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !motivation ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-lg italic text-foreground/90 min-h-[60px]">
            "{motivation || "Stay hydrated and conquer your day!"}"
          </p>
        )}
        <Button onClick={onRefresh} disabled={isLoading} variant="outline" className="w-full">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Refreshing..." : "New Motivation"}
        </Button>
      </CardContent>
    </Card>
  );
}
