'use client';

import { useBodyMetrics } from '@/contexts/BodyMetricsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

function MetricStat({ label, value, change, unit }: { label: string; value: string; change: number | null; unit: string }) {
  const getChangeIcon = () => {
    if (change === null || change === 0) return <Minus className="h-4 w-4 text-slate-500" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      <div className="flex items-center text-xs text-slate-500">
        {getChangeIcon()}
        {change !== null ? `${Math.abs(change).toFixed(1)} ${unit}` : 'No change'}
      </div>
    </div>
  );
}

export function BodyMetricsDisplay() {
  const { latestMetrics, metricsHistory, isLoading } = useBodyMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestMetrics) {
    return null; // Don't show the card if there's no data yet
  }

  const previousMetrics = metricsHistory.length > 1 ? metricsHistory[1] : null;
  const weightChange = previousMetrics ? latestMetrics.weight_kg - previousMetrics.weight_kg : null;
  const waistChange = previousMetrics ? latestMetrics.waist_cm - previousMetrics.waist_cm : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Body Metrics</CardTitle>
        <CardDescription>
          Recorded on {format(new Date(latestMetrics.timestamp), 'dd MMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricStat 
            label="Weight"
            value={latestMetrics.weight_kg.toFixed(1)}
            change={weightChange}
            unit="kg"
          />
          <MetricStat 
            label="Waist"
            value={latestMetrics.waist_cm.toFixed(1)}
            change={waistChange}
            unit="cm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
