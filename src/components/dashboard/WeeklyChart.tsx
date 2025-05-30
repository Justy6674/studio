'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Droplets, Target, Award } from 'lucide-react';

interface HydrationData {
  day: string;
  amount: number;
  goal: number;
  percentage: number;
}

interface WeeklyChartProps {
  data: HydrationData[];
  weeklyGoal?: number;
}

export function WeeklyChart({ 
  data = [], 
  weeklyGoal = 14000 // 2L x 7 days
}: WeeklyChartProps) {
  // Calculate weekly stats
  const totalIntake = data.reduce((sum, day) => sum + day.amount, 0);
  const avgDaily = totalIntake / 7;
  const goalsMet = data.filter(day => day.amount >= day.goal).length;
  const weeklyProgress = (totalIntake / weeklyGoal) * 100;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 border border-brown-500/30 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-hydration-400">
            <span className="inline-block w-3 h-3 bg-hydration-400 rounded-full mr-2"></span>
            Intake: {payload[0].value.toLocaleString()}ml
          </p>
          <p className="text-brown-300">
            <span className="inline-block w-3 h-3 bg-brown-500 rounded-full mr-2"></span>
            Goal: {payload[1]?.value.toLocaleString()}ml
          </p>
          <p className="text-cream-300 text-sm">
            {Math.round((payload[0].value / payload[1]?.value) * 100)}% of goal
          </p>
        </div>
      );
    }
    return null;
  };

  // Sample data if none provided
  const sampleData: HydrationData[] = [
    { day: 'Mon', amount: 1800, goal: 2000, percentage: 90 },
    { day: 'Tue', amount: 2200, goal: 2000, percentage: 110 },
    { day: 'Wed', amount: 1600, goal: 2000, percentage: 80 },
    { day: 'Thu', amount: 2400, goal: 2000, percentage: 120 },
    { day: 'Fri', amount: 1900, goal: 2000, percentage: 95 },
    { day: 'Sat', amount: 2100, goal: 2000, percentage: 105 },
    { day: 'Sun', amount: 1750, goal: 2000, percentage: 87.5 },
  ];

  const chartData = data.length > 0 ? data : sampleData;

  return (
    <Card className="bg-slate-700 border-brown-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Droplets className="w-5 h-5 text-hydration-400" />
          Weekly Hydration Analytics
        </CardTitle>
        <CardDescription className="text-cream-300">
          Track your hydration progress and patterns over the past week
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Weekly Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-600/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-hydration-400" />
              <span className="text-xs font-medium text-cream-300">Total Intake</span>
            </div>
            <div className="text-lg font-bold text-white">
              {(totalIntake / 1000).toFixed(1)}L
            </div>
          </div>
          
          <div className="bg-slate-600/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-brown-500" />
              <span className="text-xs font-medium text-cream-300">Daily Avg</span>
            </div>
            <div className="text-lg font-bold text-white">
              {(avgDaily / 1000).toFixed(1)}L
            </div>
          </div>
          
          <div className="bg-slate-600/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-hydration-400" />
              <span className="text-xs font-medium text-cream-300">Goals Met</span>
            </div>
            <div className="text-lg font-bold text-white">
              {goalsMet}/7
            </div>
          </div>
          
          <div className="bg-slate-600/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-brown-500" />
              <span className="text-xs font-medium text-cream-300">Weekly Goal</span>
            </div>
            <div className="text-lg font-bold text-white">
              {Math.round(weeklyProgress)}%
            </div>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-600 border-brown-500/30">
            <TabsTrigger 
              value="line" 
              className="data-[state=active]:bg-hydration-400 data-[state=active]:text-white text-cream-300"
            >
              Line Chart
            </TabsTrigger>
            <TabsTrigger 
              value="bar"
              className="data-[state=active]:bg-hydration-400 data-[state=active]:text-white text-cream-300"
            >
              Bar Chart
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="line" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#b68a71"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#b68a71"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}L`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#5271ff"
                    strokeWidth={3}
                    dot={{ fill: '#5271ff', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#5271ff', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="#b68a71"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#b68a71"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#b68a71"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}L`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill="#5271ff"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="goal" 
                    fill="#b68a71"
                    radius={[4, 4, 0, 0]}
                    opacity={0.3}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-slate-600/30 rounded-lg border border-brown-500/20">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-hydration-400" />
            Weekly Insights
          </h3>
          <div className="space-y-2 text-sm">
            {weeklyProgress >= 100 ? (
              <p className="text-hydration-400">
                🎉 Excellent! You exceeded your weekly hydration goal by {Math.round(weeklyProgress - 100)}%
              </p>
            ) : (
              <p className="text-brown-300">
                💧 You're {Math.round(100 - weeklyProgress)}% away from your weekly goal. Keep going!
              </p>
            )}
            
            {goalsMet >= 5 ? (
              <p className="text-cream-300">
                ✅ Great consistency! You met your daily goal {goalsMet} out of 7 days.
              </p>
            ) : (
              <p className="text-cream-300">
                📈 Try to be more consistent. Aim for at least 5 days of meeting your goal.
              </p>
            )}
            
            <p className="text-cream-400">
              💡 Tip: Your average daily intake is {(avgDaily / 1000).toFixed(1)}L. 
              {avgDaily < 2000 ? ' Try adding an extra glass with each meal.' : ' You\'re doing great!'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format data for the chart
export function formatWeeklyData(hydrationLogs: any[], goalAmount: number = 2000): HydrationData[] {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Start from Monday
  
  return daysOfWeek.map((day, index) => {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + index);
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayLogs = hydrationLogs.filter(log => 
      log.timestamp && log.timestamp.toDate().toISOString().split('T')[0] === dateStr
    );
    
    const totalAmount = dayLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const percentage = (totalAmount / goalAmount) * 100;
    
    return {
      day,
      amount: totalAmount,
      goal: goalAmount,
      percentage
    };
  });
} 