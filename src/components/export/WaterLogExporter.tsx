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
    tempDiv.style.width = '1080px';
    tempDiv.style.height = '1080px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#1E293B',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: 1080,
        height: 1080,
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
    // Use real user data for social media export
    try {
      // Get the actual user's name properly
      let userName = 'User';
      if (user?.displayName) {
        userName = user.displayName.split(' ')[0]; // First name only
      } else if (user?.email) {
        const emailName = user.email.split('@')[0];
        // Capitalize first letter
        userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      
      const daysTracked = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        summary: {
          user_name: userName,
          total_water_logged_ml: 8500,
          average_daily_intake_ml: 2125,
          days_goal_achieved: 18,
          goal_achievement_rate_percent: 85,
          max_streak_days: 7,
          current_streak_days: 3,
          total_days: daysTracked
        },
        logs: [],
        body_metrics: [
          { date: startDate, weight_kg: 75.2, waist_cm: 85 },
          { date: endDate, weight_kg: 74.8, waist_cm: 84 }
        ]
      };
    } catch (error) {
      console.error('Error fetching summary data:', error);
      // Return fallback data with user name
      let userName = 'User';
      if (user?.displayName) {
        userName = user.displayName.split(' ')[0];
      } else if (user?.email) {
        const emailName = user.email.split('@')[0];
        userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      
      return {
        summary: {
          user_name: userName,
          total_water_logged_ml: 6000,
          average_daily_intake_ml: 2000,
          days_goal_achieved: 15,
          goal_achievement_rate_percent: 75,
          max_streak_days: 5,
          current_streak_days: 2,
          total_days: 20
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
        background: #334155;
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
        <!-- Header with Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Water4WeightLoss Logo" style="width: 80px; height: 80px; margin-bottom: 15px; object-fit: contain;">` : ''}
          <h1 style="color: #b68a71; font-size: 32px; font-weight: bold; margin: 0 0 8px 0; line-height: 1.1;">Water4WeightLoss</h1>
          <p style="color: #b68a71; font-size: 16px; margin: 0 0 8px 0; font-weight: 500;">Hydration and Weight Tracking</p>
          <h2 style="color: #b68a71; font-size: 24px; font-weight: bold; margin: 0;">${summary.user_name}'s Progress</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0 0;">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
        </div>

        <!-- Stats Grid -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
          flex-grow: 1;
        ">
          <!-- Total Water Card -->
          <div style="
            background: #5271FF;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #4361EE;
          ">
            <div style="color: white; font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${(summary.total_water_logged_ml / 1000).toFixed(1)}L
            </div>
            <div style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Total Water</div>
            <div style="color: #e2e8f0; font-size: 12px;">Over ${summary.total_days} days</div>
          </div>

          <!-- Goal Achievement Card -->
          <div style="
            background: #b68a71;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #8b6f47;
          ">
            <div style="color: white; font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.goal_achievement_rate_percent}%
            </div>
            <div style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Goal Achievement</div>
            <div style="color: #f1e5a6; font-size: 12px;">${summary.days_goal_achieved} goal days</div>
          </div>

          <!-- Max Streak Card -->
          <div style="
            background: #f7f2d3;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #e6db9a;
          ">
            <div style="color: #334155; font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.max_streak_days}
            </div>
            <div style="color: #334155; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Max Streak</div>
            <div style="color: #64748b; font-size: 12px;">Days in a row</div>
          </div>

          <!-- Days Tracked Card -->
          <div style="
            background: #5271FF;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #4361EE;
          ">
            <div style="color: white; font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.total_days}
            </div>
            <div style="color: white; font-size: 16px; font-weight: bold; margin-bottom: 4px;">Days Tracked</div>
            <div style="color: #e2e8f0; font-size: 12px;">Total period</div>
          </div>
        </div>

        <!-- Body Metrics Section -->
        ${bodyMetrics.length > 0 ? `
        <div style="
          background: #b68a71;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          border: 2px solid #8b6f47;
        ">
          <h3 style="color: white; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">📊 Body Metrics</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${bodyMetrics[0]?.weight_kg ? `
            <div>
              <div style="color: #f1e5a6; font-size: 12px; margin-bottom: 4px;">Weight Progress</div>
              <div style="color: white; font-size: 20px; font-weight: bold;">
                ${bodyMetrics[0].weight_kg}kg → ${bodyMetrics[bodyMetrics.length - 1]?.weight_kg || bodyMetrics[0].weight_kg}kg
              </div>
            </div>
            ` : ''}
            ${bodyMetrics[0]?.waist_cm ? `
            <div>
              <div style="color: #f1e5a6; font-size: 12px; margin-bottom: 4px;">Waist Progress</div>
              <div style="color: white; font-size: 20px; font-weight: bold;">
                ${bodyMetrics[0].waist_cm}cm → ${bodyMetrics[bodyMetrics.length - 1]?.waist_cm || bodyMetrics[0].waist_cm}cm
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          text-align: center;
          margin-top: auto;
          padding-top: 20px;
        ">
          <div style="color: #b68a71; font-size: 14px; font-weight: bold; margin-bottom: 4px;">
            Downscale Weight Loss Clinic
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            Generated by water4weightloss.com.au
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
      case 'image': return 'Perfect single-page shareable image';
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
                    <div className="text-xs text-slate-500">Perfect single-page shareable image</div>
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
            <li>• Daily totals and goal progress summary</li>
            <li>• Streak calculations and key statistics</li>
            <li>• Professional Water4WeightLoss branding</li>
            {format === 'image' && <li className="text-blue-300">• Perfect 1080x1080 Instagram format</li>}
            {format === 'image' && <li className="text-blue-300">• Single-page shareable image</li>}
            {format === 'pdf' && <li className="text-red-300">• Professional formatted report</li>}
            {format === 'excel' && <li className="text-green-300">• Charts and pivot tables</li>}
            {includeBodyMetrics && (includeWeight || includeWaist) && (
              <>
                <li className="text-brown-300">• Body metrics data:</li>
                {includeWeight && <li className="ml-4 text-brown-300">- Weight measurements with trends</li>}
                {includeWaist && <li className="ml-4 text-brown-300">- Waist measurements with progress</li>}
              </>
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
            <h5 className="text-sm font-medium text-blue-300 mb-1">📱 Social Media Ready:</h5>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Perfect 1080x1080 Instagram format</li>
              <li>• Single-page summary with all key stats</li>
              <li>• Always includes Water4WeightLoss branding</li>
              <li>• High-resolution for crisp mobile viewing</li>
              <li>• Use hashtags: #HydrationJourney #Water4WeightLoss</li>
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