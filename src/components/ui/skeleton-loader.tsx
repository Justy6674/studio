import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      <div className="p-6 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="p-6">
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
}

export function SkeletonHydrationRing() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
        </div>
      </div>
      <Skeleton className="h-6 w-1/2 mx-auto" />
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full mb-2" />
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-6 w-10" />
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full mb-2" />
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-6 w-10" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-[200px] w-full" />
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-8" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
