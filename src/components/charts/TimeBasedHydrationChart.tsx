"use client";

import { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { format, parse } from "date-fns";
import type { HydrationLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimeBasedHydrationChartProps {
  logs: HydrationLog[];
  date?: Date; // Optional date to filter logs (defaults to today)
}

interface HourlyData {
  hour: string; // Hour in 24h format (00-23)
  amount: number;
  displayHour: string; // Formatted for display
}

export function TimeBasedHydrationChart({ logs, date }: TimeBasedHydrationChartProps) {
  const hourlyData = useMemo(() => {
    // Initialize array with all 24 hours
    const hours: HourlyData[] = Array.from({ length: 24 }, (_, i) => {
      // Format hour for display (e.g., "12 AM", "1 PM")
      const hourDate = new Date();
      hourDate.setHours(i, 0, 0, 0);
      
      return {
        hour: i.toString().padStart(2, '0'),
        displayHour: format(hourDate, 'h a'), // e.g., "1 AM", "2 PM"
        amount: 0
      };
    });

    // Filter logs for the specified date (or today if not provided)
    const targetDate = date || new Date();
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    
    // Group logs by hour and sum amounts
    logs
      .filter(log => {
        const logDate = new Date(log.timestamp);
        return format(logDate, 'yyyy-MM-dd') === targetDateStr;
      })
      .forEach(log => {
        const logDate = new Date(log.timestamp);
        const hour = logDate.getHours().toString().padStart(2, '0');
        
        // Find the correct hour bucket and add the amount
        const hourBucket = hours.find(h => h.hour === hour);
        if (hourBucket) {
          hourBucket.amount += log.amount;
        }
      });

    return hours;
  }, [logs, date]);

  // Custom tooltip to display hour and amount
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="text-sm font-medium">{`${payload[0].payload.displayHour}`}</p>
          <p className="text-sm text-muted-foreground">{`${payload[0].value}ml`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Hydration by Time of Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={hourlyData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="displayHour"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => value.replace(' ', '')}
              interval={3} // Show every 3 hours for better readability
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={30}
              tickFormatter={(value) => `${value}ml`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#5271ff"
              fill="#5271ff"
              fillOpacity={0.2}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Shows when you typically hydrate throughout the day
        </p>
      </CardContent>
    </Card>
  );
}
