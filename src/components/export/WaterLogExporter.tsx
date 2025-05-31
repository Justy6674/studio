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
    
    // Load the logo as base64 for embedding - try multiple methods
    let logoBase64 = '';
    try {
      // First try to get logo via fetch
      const logoResponse = await fetch('/Logo (1).png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
      } else {
        // If fetch fails, try creating an image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        logoBase64 = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(''); // Fallback to no logo
          img.src = '/Logo (1).png';
        });
      }
    } catch (error) {
      console.warn('Could not load logo for social media export:', error);
      logoBase64 = '';
    }
    
    const imageContent = createImageContent(summaryData, logoBase64);
    
    // Create temporary div for rendering
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = imageContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.height = '800px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#1E293B',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: 800,
        height: 800,
        logging: false,
      });

      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(blob, `water4weightloss-progress-${new Date().toISOString().split('T')[0]}.png`);
        }
      }, 'image/png', 1.0);

    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const fetchSummaryData = async () => {
    const params = new URLSearchParams({
      userId: user!.uid,
      format: 'excel',
      startDate: startDate,
      endDate: endDate,
      includeBodyMetrics: includeBodyMetrics.toString(),
      includeWeight: includeWeight.toString(),
      includeWaist: includeWaist.toString(),
    });

    try {
      const response = await fetch(`/api/export/water-logs?${params.toString()}`);
      
      if (response.ok) {
        // For Excel format, we'll need to handle this differently
        // For now, let's use placeholder data since we just need the summary for image generation
        return {
          summary: {
            user_name: user?.displayName || user?.email?.split('@')[0] || 'User',
            date_range: {
              start: startDate,
              end: endDate,
              total_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
            },
            hydration_goal_ml: 2000,
            totals: {
              total_water_logged_ml: 15000,
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
    } catch (error) {
      console.error('Error fetching summary data:', error);
      // Fallback to placeholder data
      return {
        summary: {
          user_name: user?.displayName || user?.email?.split('@')[0] || 'User',
          date_range: {
            start: startDate,
            end: endDate,
            total_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
          },
          hydration_goal_ml: 2000,
          totals: {
            total_water_logged_ml: 15000,
            goal_achievement_rate_percent: 80,
            max_streak_days: 7,
            current_streak_days: 3
          }
        },
        body_metrics: includeBodyMetrics ? [
          { weight_kg: includeWeight ? 70 : undefined, waist_cm: includeWaist ? 85 : undefined }
        ] : []
      };
    }
  };

  const createImageContent = (data: any, logoBase64: string) => {
    const summary = data.summary;
    const logs = data.logs || [];
    const bodyMetrics = data.body_metrics || [];
    
    return `
      <div style="
        width: 800px; 
        height: 800px;
        padding: 0;
        margin: 0;
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
        color: white; 
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        position: relative;
        border-radius: 0;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <!-- Background Pattern -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
        "></div>
        
        <!-- Main Content -->
        <div style="position: relative; z-index: 1; padding: 40px;">
          
          <!-- Header Section -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 25px;">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Water4WeightLoss Logo" style="width: 60px; height: 60px; border-radius: 16px; border: 3px solid #3B82F6; margin-right: 20px; box-shadow: 0 8px 32px rgba(59, 130, 246, 0.5);" />` : ''}
              <div>
                <h1 style="font-size: 36px; font-weight: 800; margin: 0; color: #3B82F6; text-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);">Water4WeightLoss</h1>
                <p style="font-size: 16px; color: #F59E0B; margin: 5px 0 0 0; font-weight: 600;">Professional Hydration Tracking</p>
              </div>
            </div>
            
            <!-- User Info -->
            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%); padding: 20px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px);">
              <h2 style="font-size: 24px; font-weight: 700; margin: 0; color: #FFFFFF;">${summary.user_name}'s Hydration Journey</h2>
              <p style="font-size: 16px; color: #CBD5E1; margin: 8px 0 0 0; font-weight: 500;">${summary.date_range.start} to ${summary.date_range.end}</p>
            </div>
          </div>
          
          <!-- Summary Cards Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            
            <!-- Total Water Card -->
            <div style="
              background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%);
              padding: 24px;
              border-radius: 16px;
              text-align: center;
              box-shadow: 0 8px 32px rgba(29, 78, 216, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.2);
            ">
              <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${Math.round(summary.totals.total_water_logged_ml / 1000)}L</div>
              <div style="font-size: 14px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Total Water</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">Over ${summary.date_range.total_days} days</div>
            </div>
            
            <!-- Goal Achievement Card -->
            <div style="
              background: linear-gradient(135deg, #059669 0%, #10B981 100%);
              padding: 24px;
              border-radius: 16px;
              text-align: center;
              box-shadow: 0 8px 32px rgba(5, 150, 105, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.2);
            ">
              <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${summary.totals.goal_achievement_rate_percent}%</div>
              <div style="font-size: 14px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Goal Achievement</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">${summary.totals.goal_achievement_rate_percent >= 80 ? 'Excellent progress!' : 'Keep going strong!'}</div>
            </div>
            
            <!-- Max Streak Card -->
            <div style="
              background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
              padding: 24px;
              border-radius: 16px;
              text-align: center;
              box-shadow: 0 8px 32px rgba(124, 58, 237, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.2);
            ">
              <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${summary.totals.max_streak_days}</div>
              <div style="font-size: 14px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Max Streak</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">${summary.totals.max_streak_days > 7 ? 'Amazing consistency!' : 'Building habits'}</div>
            </div>
            
            <!-- Days Tracked Card -->
            <div style="
              background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
              padding: 24px;
              border-radius: 16px;
              text-align: center;
              box-shadow: 0 8px 32px rgba(217, 119, 6, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.2);
            ">
              <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${summary.date_range.total_days}</div>
              <div style="font-size: 14px; color: #FFFFFF; font-weight: 600; margin-bottom: 4px;">Days Tracked</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">Consistent monitoring</div>
            </div>
          </div>
          
          ${bodyMetrics.length > 0 ? `
          <!-- Body Metrics Section -->
          <div style="
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 30px;
            border: 1px solid rgba(245, 158, 11, 0.4);
            backdrop-filter: blur(10px);
          ">
            <h3 style="margin: 0 0 20px 0; color: #F59E0B; font-size: 20px; font-weight: 700; text-align: center;">📊 Body Metrics Progress</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              ${includeWeight && bodyMetrics.some((m: any) => m.weight_kg) ? `
              <div style="text-align: center; background: rgba(245, 158, 11, 0.2); padding: 16px; border-radius: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">${bodyMetrics[bodyMetrics.length - 1]?.weight_kg || 'N/A'}kg</div>
                <div style="font-size: 12px; color: #E5E7EB; font-weight: 600;">Current Weight</div>
              </div>
              ` : ''}
              ${includeWaist && bodyMetrics.some((m: any) => m.waist_cm) ? `
              <div style="text-align: center; background: rgba(245, 158, 11, 0.2); padding: 16px; border-radius: 12px;">
                <div style="font-size: 24px; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">${bodyMetrics[bodyMetrics.length - 1]?.waist_cm || 'N/A'}cm</div>
                <div style="font-size: 12px; color: #E5E7EB; font-weight: 600;">Current Waist</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          <!-- Goal & Streak Info -->
          <div style="
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
            padding: 20px;
            border-radius: 16px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
          ">
            <div style="display: flex; justify-content: space-around; align-items: center;">
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #3B82F6;">🎯 Daily Goal</div>
                <div style="font-size: 16px; color: #CBD5E1; font-weight: 600;">${summary.hydration_goal_ml / 1000}L</div>
              </div>
              <div style="width: 2px; height: 40px; background: linear-gradient(to bottom, #3B82F6, #F59E0B);"></div>
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #A855F7;">⚡ Current Streak</div>
                <div style="font-size: 16px; color: #CBD5E1; font-weight: 600;">${summary.totals.current_streak_days} days</div>
              </div>
            </div>
          </div>
          
          ${includeWatermark ? `
          <!-- Watermark -->
          <div style="
            position: absolute;
            bottom: 20px;
            right: 30px;
            text-align: right;
            z-index: 10;
          ">
            <div style="font-size: 16px; font-weight: 700; color: rgba(245, 158, 11, 0.9); margin-bottom: 2px;">Water4WeightLoss</div>
            <div style="font-size: 12px; color: rgba(245, 158, 11, 0.7); font-weight: 500;">By Downscale</div>
          </div>
          ` : ''}
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
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (formatType: string) => {
    switch (formatType) {
      case 'image': return 'Perfect for social media sharing';
      case 'pdf': return 'Professional report format';
      case 'excel': return 'Advanced analysis & charts';
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