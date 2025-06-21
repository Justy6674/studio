"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download, Image, FileText, BarChart3, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ExportCenterProps {
  // Dashboard data
  currentIntake?: number;
  hydrationGoal?: number; 
  dailyStreak?: number;
  longestStreak?: number;
  userName?: string;
  hydrationLogs?: unknown[];
}

type ExportType = 'progress-summary' | 'hydration-chart' | 'weight-chart' | 'streak-calendar' | 'comparison-chart';
type TimeRange = '7d' | '30d' | '90d' | 'all';
type Format = 'image' | 'pdf';

export default function ExportCenter({
  currentIntake = 0,
  hydrationGoal = 2000,
  dailyStreak = 0,
  longestStreak = 0,
  userName = "Friend",
  hydrationLogs = [],
}: ExportCenterProps) {
  const { user } = useAuth();
  const [selectedExport, setSelectedExport] = useState<ExportType>('progress-summary');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [format, setFormat] = useState<Format>('image');
  const [isGenerating, setIsGenerating] = useState(false);

  const exportOptions = [
    {
      id: 'progress-summary' as ExportType,
      title: 'Progress Summary',
      description: 'Current stats and achievements',
      icon: BarChart3,
      preview: 'Social media ready summary of your journey'
    },
    {
      id: 'hydration-chart' as ExportType,
      title: 'Hydration Trends',
      description: 'Daily water intake over time',
      icon: TrendingUp,
      preview: 'Line chart showing your hydration patterns'
    },
    {
      id: 'weight-chart' as ExportType,
      title: 'Weight Progress',
      description: 'Weight and measurements over time',
      icon: TrendingUp,
      preview: 'Track your weight loss journey visually'
    },
    {
      id: 'streak-calendar' as ExportType,
      title: 'Streak Calendar',
      description: 'Consistency heatmap',
      icon: Calendar,
      preview: 'GitHub-style calendar of your hydration streaks'
    },
    {
      id: 'comparison-chart' as ExportType,
      title: 'Water vs Weight',
      description: 'Correlation analysis',
      icon: BarChart3,
      preview: 'See how hydration affects your weight loss'
    }
  ];

  const timeRangeOptions = [
    { value: '7d' as TimeRange, label: 'Last 7 Days' },
    { value: '30d' as TimeRange, label: 'Last 30 Days' },
    { value: '90d' as TimeRange, label: 'Last 90 Days' },
    { value: 'all' as TimeRange, label: 'All Time' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Generate the selected export type
      const result = await generateExport({
        type: selectedExport,
        timeRange,
        format,
        data: {
          currentIntake,
          hydrationGoal,
          dailyStreak,
          longestStreak,
          userName,
          hydrationLogs,
          userId: user?.uid
        }
      });
      
      if (result.success) {
        // Download the generated file
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.filename;
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedOption = exportOptions.find(opt => opt.id === selectedExport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Export Your Progress</h2>
        <p className="text-gray-600 mt-2">Share your journey or save your data</p>
      </div>

      {/* Export Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedExport === option.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedExport(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    selectedExport === option.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.preview}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Options Panel */}
      {selectedOption && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <selectedOption.icon className="w-5 h-5" />
              <span>{selectedOption.title} Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Range */}
            <div>
              <label htmlFor="time-period-group" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="flex flex-wrap gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeRange === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label htmlFor="export-format-group" className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('image')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    format === 'image'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Image className="w-4 h-4" aria-hidden="true" />
                  <span>Image (PNG)</span>
                </button>
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    format === 'pdf'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Document</span>
                </button>
              </div>
            </div>

            {/* Preview Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">What you'll get:</h4>
              <p className="text-sm text-gray-600">{selectedOption.preview}</p>
              <div className="mt-2 text-xs text-gray-500">
                <p>• {timeRangeOptions.find(t => t.value === timeRange)?.label} of data</p>
                <p>• {format === 'image' ? 'High-quality image' : 'PDF document'} format</p>
                <p>• <span className="font-semibold">Water4WeightLoss</span> branding included</p>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate {selectedOption.title}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export generation function
async function generateExport(options: {
  type: ExportType;
  timeRange: TimeRange;
  format: Format;
  data: unknown;
}): Promise<{ success: boolean; url: string; filename: string }> {
  const response = await fetch('/api/export/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error('Export generation failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${options.type}-${options.timeRange}-${timestamp}.${
    options.format === 'image' ? 'png' : 'pdf'
  }`;

  return { success: true, url, filename };
}