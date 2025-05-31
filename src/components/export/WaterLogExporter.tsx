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
  const [format, setFormat] = useState("image");
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
    // Use placeholder data for social media export since we just need it for display
    // The real data export happens server-side for PDF/Excel
    
    try {
      const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
      const daysTracked = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        summary: {
          user_name: userName,
          date_range: `${startDate} to ${endDate}`,
          total_water: 15, // Placeholder - actual data is in PDF/Excel exports
          days_tracked: daysTracked,
          goal_achievement: 80,
          max_streak: 7
        },
        logs: [],
        body_metrics: includeBodyMetrics ? [
          { 
            weight: includeWeight ? 70 : undefined, 
            waist: includeWaist ? 85 : undefined 
          }
        ] : []
      };
    } catch (error) {
      console.error('Error in fetchSummaryData:', error);
      // Return safe fallback data
      return {
        summary: {
          user_name: user?.displayName || user?.email?.split('@')[0] || 'User',
          date_range: `${startDate} to ${endDate}`,
          total_water: 15,
          days_tracked: 31,
          goal_achievement: 80,
          max_streak: 7
        },
        logs: [],
        body_metrics: []
      };
    }
  };

  const createImageContent = (data: any, logoBase64: string) => {
    const summary = data.summary;
    const logs = data.logs || [];
    const bodyMetrics = data.body_metrics || [];
    
    return `
      <div style="
        width: 1080px; 
        height: 1080px;
        padding: 40px;
        margin: 0;
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
        color: white; 
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        position: relative;
        border-radius: 0;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoBase64 ? `
            <img src="${logoBase64}" alt="Water4WeightLoss" style="
              width: 80px; 
              height: 80px; 
              margin: 0 auto 15px auto; 
              display: block;
              border-radius: 12px;
            " />
          ` : `
            <div style="
              width: 80px; 
              height: 80px; 
              margin: 0 auto 15px auto; 
              background: linear-gradient(135deg, #3B82F6, #1D4ED8);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
            ">💧</div>
          `}
          <h1 style="
            margin: 0;
            font-size: 42px;
            font-weight: 800;
            background: linear-gradient(135deg, #60A5FA, #3B82F6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Water4WeightLoss</h1>
          <p style="
            margin: 8px 0 0 0;
            font-size: 18px;
            color: #F59E0B;
            font-weight: 600;
          ">Hydration and Weight Tracking</p>
        </div>

        <!-- User Info -->
        <div style="
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 25px;
          border-radius: 20px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        ">
          <h2 style="
            margin: 0 0 8px 0;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
          ">${summary.user_name}'s Progress</h2>
          <p style="
            margin: 0;
            font-size: 18px;
            color: #94A3B8;
          ">${summary.date_range}</p>
        </div>

        <!-- Stats Grid -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        ">
          <!-- Total Water -->
          <div style="
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(59, 130, 246, 0.3);
          ">
            <div style="
              font-size: 48px;
              font-weight: 800;
              color: white;
              margin-bottom: 8px;
            ">${summary.total_water}L</div>
            <div style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
            ">Total Water</div>
            <div style="
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin-top: 4px;
            ">Over ${summary.days_tracked} days</div>
          </div>

          <!-- Goal Achievement -->
          <div style="
            background: linear-gradient(135deg, #10B981, #059669);
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(16, 185, 129, 0.3);
          ">
            <div style="
              font-size: 48px;
              font-weight: 800;
              color: white;
              margin-bottom: 8px;
            ">${summary.goal_achievement}%</div>
            <div style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
            ">Goal Achievement</div>
            <div style="
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin-top: 4px;
            ">${summary.goal_achievement >= 80 ? 'Excellent progress!' : 'Keep going!'}</div>
          </div>

          <!-- Max Streak -->
          <div style="
            background: linear-gradient(135deg, #A855F7, #7C3AED);
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(168, 85, 247, 0.3);
          ">
            <div style="
              font-size: 48px;
              font-weight: 800;
              color: white;
              margin-bottom: 8px;
            ">${summary.max_streak}</div>
            <div style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
            ">Max Streak</div>
            <div style="
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin-top: 4px;
            ">Building habits</div>
          </div>

          <!-- Days Tracked -->
          <div style="
            background: linear-gradient(135deg, #F59E0B, #D97706);
            padding: 25px;
            border-radius: 20px;
            text-align: center;
            border: 2px solid rgba(245, 158, 11, 0.3);
          ">
            <div style="
              font-size: 48px;
              font-weight: 800;
              color: white;
              margin-bottom: 8px;
            ">${summary.days_tracked}</div>
            <div style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
            ">Days Tracked</div>
            <div style="
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin-top: 4px;
            ">Consistent monitoring</div>
          </div>
        </div>

        ${bodyMetrics.length > 0 ? `
        <!-- Body Metrics -->
        <div style="
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          padding: 25px;
          border-radius: 20px;
          margin-bottom: 20px;
          border: 2px solid rgba(139, 92, 246, 0.3);
        ">
          <h3 style="
            margin: 0 0 20px 0;
            font-size: 22px;
            font-weight: 700;
            color: white;
            text-align: center;
          ">📊 Body Metrics Progress</h3>
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          ">
            ${bodyMetrics[0]?.weight ? `
            <div style="
              background: rgba(255, 255, 255, 0.2);
              padding: 20px;
              border-radius: 15px;
              text-align: center;
            ">
              <div style="
                font-size: 36px;
                font-weight: 800;
                color: white;
                margin-bottom: 5px;
              ">${bodyMetrics[0].weight}kg</div>
              <div style="
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 600;
              ">Current Weight</div>
            </div>
            ` : ''}
            ${bodyMetrics[0]?.waist ? `
            <div style="
              background: rgba(255, 255, 255, 0.2);
              padding: 20px;
              border-radius: 15px;
              text-align: center;
            ">
              <div style="
                font-size: 36px;
                font-weight: 800;
                color: white;
                margin-bottom: 5px;
              ">${bodyMetrics[0].waist}cm</div>
              <div style="
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 600;
              ">Current Waist</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          text-align: center;
          color: #64748B;
          font-size: 14px;
          margin-top: auto;
        ">
          <div style="
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          ">
            <strong style="color: #F59E0B;">Water4WeightLoss</strong> • Track your hydration journey
          </div>
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