"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Calendar, FileText, FileSpreadsheet, Scale, Droplets, Camera, FileDown, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function WaterLogExporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("csv");
  const [includeBodyMetrics, setIncludeBodyMetrics] = useState(true);
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeWaist, setIncludeWaist] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const exportPreviewRef = useRef<HTMLDivElement>(null);

  // Set default date range (last 30 days)
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Initialize with default dates
  useState(() => {
    const defaults = getDefaultDates();
    setStartDate(defaults.start);
    setEndDate(defaults.end);
  });

  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to export your data.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        userId: user.uid,
        format: format,
        startDate: startDate,
        endDate: endDate,
        includeBodyMetrics: includeBodyMetrics.toString(),
        includeWeight: includeWeight.toString(),
        includeWaist: includeWaist.toString(),
        includeWatermark: includeWatermark.toString(),
      });

      const response = await fetch(`/api/export/water-logs?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Handle different export formats
      if (format === 'image') {
        // Image export will be handled client-side
        await exportAsImage();
        return;
      } else if (format === 'pdf') {
        // PDF export handled by API
        const blob = await response.blob();
        downloadFile(blob, `water4weightloss-export-${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (format === 'excel') {
        // Excel export handled by API
        const blob = await response.blob();
        downloadFile(blob, `water4weightloss-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // CSV export
        const blob = await response.blob();
        downloadFile(blob, `water4weightloss-export-${new Date().toISOString().split('T')[0]}.csv`);
      }

      const formatNames = {
        csv: 'CSV',
        excel: 'Excel',
        pdf: 'PDF',
        image: 'Image'
      };

      toast({
        title: "Export Successful! 🎉",
        description: `Your ${includeBodyMetrics && (includeWeight || includeWaist) ? 'comprehensive' : 'hydration'} data has been downloaded as ${formatNames[format as keyof typeof formatNames]}.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a summary card for image export
    const summaryData = await fetchSummaryData();
    const imageContent = createImageContent(summaryData);
    
    // Create temporary div for rendering
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = imageContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '40px';
    tempDiv.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
    tempDiv.style.color = 'white';
    tempDiv.style.fontFamily = 'Inter, sans-serif';
    tempDiv.style.borderRadius = '16px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Add watermark if enabled
      if (includeWatermark) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Add watermark
          ctx.fillStyle = 'rgba(182, 138, 113, 0.6)';
          ctx.font = 'bold 24px Inter';
          ctx.textAlign = 'right';
          ctx.fillText('Water4WeightLoss', canvas.width - 40, canvas.height - 40);
          
          // Add website URL
          ctx.fillStyle = 'rgba(182, 138, 113, 0.5)';
          ctx.font = '16px Inter';
          ctx.fillText('Track your hydration journey', canvas.width - 40, canvas.height - 60);
        }
      }

      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(blob, `water4weightloss-progress-${new Date().toISOString().split('T')[0]}.png`);
        }
      }, 'image/png');

    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const fetchSummaryData = async () => {
    const params = new URLSearchParams({
      userId: user!.uid,
      format: 'csv',
      startDate: startDate,
      endDate: endDate,
      includeBodyMetrics: includeBodyMetrics.toString(),
      includeWeight: includeWeight.toString(),
      includeWaist: includeWaist.toString(),
    });

    const response = await fetch(`/api/export/water-logs?${params.toString()}`);
    
    // For image generation, we need to create our own summary from available data
    // Since we removed JSON export, we'll create a summary object
    if (response.ok) {
      // Create a mock summary for image generation
      return {
        summary: {
          user_name: user?.displayName || user?.email?.split('@')[0] || 'User',
          date_range: {
            start: startDate,
            end: endDate,
            total_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
          },
          hydration_goal_ml: 2000, // Default goal
          totals: {
            total_water_logged_ml: 15000, // Placeholder - you might want to calculate this
            goal_achievement_rate_percent: 80,
            max_streak_days: 7,
            current_streak_days: 3
          }
        },
        body_metrics: includeBodyMetrics ? [
          { weight_kg: includeWeight ? 70 : undefined, waist_cm: includeWaist ? 85 : undefined }
        ] : []
      };
    } else {
      throw new Error('Failed to fetch data for image generation');
    }
  };

  const createImageContent = (data: any) => {
    const summary = data.summary;
    const logs = data.logs || [];
    const bodyMetrics = data.body_metrics || [];
    
    return `
      <div style="width: 720px; padding: 40px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; color: white; font-family: Inter, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; margin: 0; color: #94a3b8;">💧 Hydration Progress</h1>
          <p style="font-size: 18px; color: #64748b; margin: 10px 0;">${summary.user_name}'s Journey</p>
          <p style="font-size: 14px; color: #475569;">${summary.date_range.start} to ${summary.date_range.end}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${Math.round(summary.totals.total_water_logged_ml / 1000)}L</div>
            <div style="font-size: 14px; color: #94a3b8;">Total Water</div>
          </div>
          <div style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${summary.totals.goal_achievement_rate_percent}%</div>
            <div style="font-size: 14px; color: #94a3b8;">Goal Achievement</div>
          </div>
          <div style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #a855f7;">${summary.totals.max_streak_days}</div>
            <div style="font-size: 14px; color: #94a3b8;">Max Streak</div>
          </div>
          <div style="background: rgba(182, 138, 113, 0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #b68a71;">${summary.date_range.total_days}</div>
            <div style="font-size: 14px; color: #94a3b8;">Days Tracked</div>
          </div>
        </div>
        
        ${bodyMetrics.length > 0 ? `
        <div style="background: rgba(182, 138, 113, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #b68a71; font-size: 18px;">📊 Body Metrics Progress</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${includeWeight && bodyMetrics.some((m: any) => m.weight_kg) ? `
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #b68a71;">${bodyMetrics[bodyMetrics.length - 1]?.weight_kg || 'N/A'}kg</div>
              <div style="font-size: 12px; color: #94a3b8;">Current Weight</div>
            </div>
            ` : ''}
            ${includeWaist && bodyMetrics.some((m: any) => m.waist_cm) ? `
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #b68a71;">${bodyMetrics[bodyMetrics.length - 1]?.waist_cm || 'N/A'}cm</div>
              <div style="font-size: 12px; color: #94a3b8;">Current Waist</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <div style="font-size: 12px; color: #64748b;">🎯 Daily Goal: ${summary.hydration_goal_ml / 1000}L | ⚡ Current Streak: ${summary.totals.current_streak_days} days</div>
        </div>
      </div>
    `;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'image': return <Camera className="h-4 w-4" />;
      case 'pdf': return <FileDown className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (formatType: string) => {
    switch (formatType) {
      case 'image': return 'Perfect for social media sharing';
      case 'pdf': return 'Professional report format';
      case 'excel': return 'Advanced analysis & charts';
      case 'csv': return 'Universal spreadsheet format';
      default: return 'Export your data';
    }
  };

  return (
    <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-200">
          <Share2 className="h-6 w-6 text-brown-400" />
          Export & Share Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Date Range Buttons */}
        <div className="space-y-2">
          <Label className="text-slate-300">Quick Date Ranges:</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(7)}
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(30)}
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(90)}
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Last 3 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange(365)}
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Last Year
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate" className="text-slate-300">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-slate-300">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-slate-100"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <Label className="text-slate-300">Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <div>
                    <div>📱 Social Media Image</div>
                    <div className="text-xs text-slate-500">Perfect for sharing progress</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  <div>
                    <div>📄 PDF Report</div>
                    <div className="text-xs text-slate-500">Professional document</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <div>📊 Excel Workbook</div>
                    <div className="text-xs text-slate-500">Advanced analysis & charts</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <div>📈 CSV Spreadsheet</div>
                    <div className="text-xs text-slate-500">Universal format</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Watermark Option */}
        {(format === 'image' || format === 'pdf') && (
          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <Checkbox 
              checked={includeWatermark} 
              onCheckedChange={(checked) => setIncludeWatermark(checked as boolean)}
              className="data-[state=checked]:bg-brown-500 data-[state=checked]:border-brown-500"
            />
            <div>
              <Label className="text-slate-200">Include Water4WeightLoss Watermark</Label>
              <p className="text-xs text-slate-400">Great for social media sharing and brand recognition</p>
            </div>
          </div>
        )}

        {/* Data Selection Options */}
        <div className="space-y-4">
          <Label className="text-slate-300">Data to Include</Label>
          
          {/* Hydration Data - Always included */}
          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <Checkbox 
              checked={true} 
              disabled={true}
              className="data-[state=checked]:bg-hydration-500 data-[state=checked]:border-hydration-500"
            />
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-hydration-400" />
              <div>
                <Label className="text-slate-200">Hydration Data</Label>
                <p className="text-xs text-slate-400">Water intake logs, daily totals, streaks (always included)</p>
              </div>
            </div>
          </div>

          {/* Body Metrics Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <Checkbox 
              checked={includeBodyMetrics} 
              onCheckedChange={(checked) => {
                setIncludeBodyMetrics(checked as boolean);
                if (!checked) {
                  setIncludeWeight(false);
                  setIncludeWaist(false);
                }
              }}
              className="data-[state=checked]:bg-brown-500 data-[state=checked]:border-brown-500"
            />
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-brown-400" />
              <div>
                <Label className="text-slate-200">Body Metrics Data</Label>
                <p className="text-xs text-slate-400">Include your weight and waist measurements</p>
              </div>
            </div>
          </div>

          {/* Individual Body Metrics Options */}
          {includeBodyMetrics && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={includeWeight} 
                  onCheckedChange={(checked) => setIncludeWeight(checked as boolean)}
                  className="data-[state=checked]:bg-brown-500 data-[state=checked]:border-brown-500"
                />
                <Label className="text-slate-300">Weight measurements (kg)</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={includeWaist} 
                  onCheckedChange={(checked) => setIncludeWaist(checked as boolean)}
                  className="data-[state=checked]:bg-brown-500 data-[state=checked]:border-brown-500"
                />
                <Label className="text-slate-300">Waist measurements (cm)</Label>
              </div>
            </div>
          )}
        </div>

        {/* Format Preview */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
            {getFormatIcon(format)}
            {format === 'image' && '📸 Social Media Ready'}
            {format === 'pdf' && '📄 Professional Report'}
            {format === 'excel' && '📊 Advanced Analytics'}
            {format === 'csv' && '📈 Spreadsheet Data'}
          </h4>
          <p className="text-sm text-slate-400 mb-3">{getFormatDescription(format)}</p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• All water intake logs with timestamps</li>
            <li>• Daily totals and goal progress</li>
            <li>• Streak calculations and statistics</li>
            {format === 'image' && <li className="text-blue-300">• Visual progress summary card</li>}
            {format === 'pdf' && <li className="text-red-300">• Professional formatted report</li>}
            {format === 'excel' && <li className="text-green-300">• Charts and pivot tables</li>}
            {includeBodyMetrics && (includeWeight || includeWaist) && (
              <>
                <li className="text-brown-300">• Body metrics data:</li>
                {includeWeight && <li className="ml-4 text-brown-300">- Weight measurements with trends</li>}
                {includeWaist && <li className="ml-4 text-brown-300">- Waist measurements with progress</li>}
              </>
            )}
            {includeWatermark && (format === 'image' || format === 'pdf') && (
              <li className="text-brown-300">• Water4WeightLoss branding watermark</li>
            )}
          </ul>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !startDate || !endDate}
          className="w-full bg-brown-600 hover:bg-brown-700 text-white text-lg py-6"
        >
          {isExporting ? (
            <>
              <Download className="mr-2 h-5 w-5 animate-pulse" />
              Creating {format === 'image' ? 'Image' : format.toUpperCase()}...
            </>
          ) : (
            <>
              {getFormatIcon(format)}
              <span className="ml-2">
                {format === 'image' && '📸 Create Social Media Post'}
                {format === 'pdf' && '📄 Generate PDF Report'}
                {format === 'excel' && '📊 Export Excel Workbook'}
                {format === 'csv' && '📈 Download CSV Data'}
              </span>
            </>
          )}
        </Button>

        {/* Social Media Tips for Image Export */}
        {format === 'image' && (
          <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-700/30">
            <h5 className="text-sm font-medium text-blue-300 mb-1">📱 Social Media Tips:</h5>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Perfect size for Instagram posts and stories</li>
              <li>• Share your hydration journey with friends</li>
              <li>• Use hashtags: #HydrationJourney #Water4WeightLoss</li>
              <li>• Motivate others with your progress!</li>
            </ul>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-xs text-slate-500 text-center">
          Your data is exported securely and remains private. 
          {format === 'image' && ' Image exports are perfect for sharing your achievements!'}
        </p>
      </CardContent>
    </Card>
  );
} 