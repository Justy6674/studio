'use client';

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface DailyData {
  date: string;
  amount: number;
  rawDate?: Date;
}

interface LogEntry {
  amount: number;
  timestamp: string | number | Date;
  drinkType?: string;
  drinkName?: string;
}

interface InteractiveBarChartProps {
  data: DailyData[];
  logs: LogEntry[];
}

export function InteractiveBarChart({ data, logs }: InteractiveBarChartProps) {
  const [selectedDay, setSelectedDay] = useState<null | DailyData>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Get detailed logs for selected day
  const getDetailedLogs = (date: Date) => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return (
        logDate.getDate() === date.getDate() &&
        logDate.getMonth() === date.getMonth() &&
        logDate.getFullYear() === date.getFullYear()
      );
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };
  
  const handleBarClick = (data: DailyData) => {
    if (data.rawDate) {
      setSelectedDay(data);
      setShowDetailDialog(true);
    }
  };
  
  const dayDetailedLogs = selectedDay?.rawDate 
    ? getDetailedLogs(selectedDay.rawDate) 
    : [];

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: '0.8rem' }}
          />
          <YAxis 
            unit="ml" 
            tick={{ fill: '#6b7280', fontSize: '0.8rem' }}
          />
          <Tooltip 
            formatter={(value) => `${value} ml`}
            wrapperStyle={{ outline: 'none' }}
            cursor={{ fill: 'rgba(82, 113, 255, 0.1)' }}
          />
          <Bar 
            dataKey="amount" 
            fill="#5271ff" 
            radius={[4, 4, 0, 0]} 
            onClick={handleBarClick}
            isAnimationActive={true}
            animationDuration={800}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.amount > 2000 ? '#22c55e' : '#5271ff'}
                fillOpacity={entry.date === selectedDay?.date ? 1 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.rawDate && format(selectedDay.rawDate, 'EEEE, MMMM d')}
            </DialogTitle>
            <DialogDescription>
              Total: {selectedDay?.amount} ml
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            {dayDetailedLogs.length > 0 ? (
              dayDetailedLogs.map((log, idx) => (
                <Card key={idx} className="bg-secondary/50">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <p className="font-medium">{log.amount} ml</p>
                        {log.drinkType && (
                          <p className="text-xs text-muted-foreground">
                            {log.drinkName || log.drinkType}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No entries for this day</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
