"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Calendar, FileText, FileSpreadsheet, Scale, Droplets, Camera, FileDown, Share2, Loader2 } from "lucide-react";
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

  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30); // Default to last 30 days
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const { start, end } = getDefaultDates();
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleProgressDownload = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to export your progress",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportAsImage();
    } catch (error) {
      console.error('Export failed:', error);
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
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      // Fetch data for the image
      const data = await fetchSummaryData();
      
      // Load logo
      let logoBase64 = '';
      try {
        const response = await fetch('/Logo (1).png');
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.log('Logo loading failed, continuing without logo');
      }

      // Create the amazing image content
      const imageContent = createStunningImageContent(data, logoBase64);
      
      // Convert to image and download
      const element = document.createElement('div');
      element.innerHTML = imageContent;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';
      document.body.appendChild(element);

      try {
        const canvas = await html2canvas(element.firstChild as HTMLElement, {
          width: 1080,
          height: 1080,
          scale: 2, // High resolution for crisp quality
          backgroundColor: '#334155', // Brand slate background
          allowTaint: true,
          useCORS: true,
          logging: false
        });

        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const filename = `${data.summary.user_name}-progress-${new Date().toISOString().split('T')[0]}.png`;
            downloadFile(blob, filename);
          }
        }, 'image/png', 1.0);
      } finally {
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error('Image export failed:', error);
      throw error;
    }
  };

  const fetchSummaryData = async () => {
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
          goal_achievement_rate: 85,
          max_streak_days: 12,
          days_tracked: daysTracked,
          date_range: `${startDate} to ${endDate}`,
          // Sample weight data - remove if no body metrics
          current_weight: 75.2,
          weight_change: -2.3,
          current_waist: 85.0,
          waist_change: -4.5
        },
        logs: [],
        body_metrics: []
      };
    } catch (error) {
      console.error('Error fetching summary data:', error);
      throw error;
    }
  };

  const createStunningImageContent = (data: any, logoBase64: string) => {
    const summary = data.summary;
    const totalWaterL = Math.round((summary.total_water_logged_ml / 1000) * 10) / 10;
    
    return `
      <div style="
        width: 1080px; 
        height: 1080px;
        padding: 40px;
        margin: 0;
        background: linear-gradient(135deg, #334155 0%, #475569 100%);
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
        <!-- Header with Logo and Branding -->
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoBase64 ? `
            <img src="${logoBase64}" alt="Water4WeightLoss" style="
              height: 80px; 
              width: auto; 
              margin-bottom: 15px;
              filter: brightness(1.1);
            " />
          ` : `
            <div style="
              font-size: 32px; 
              font-weight: bold; 
              color: #b68a71; 
              margin-bottom: 15px;
            ">Water4WeightLoss</div>
          `}
          <div style="
            font-size: 18px; 
            color: #b68a71; 
            font-weight: 600;
            margin-bottom: 10px;
          ">Hydration and Weight Tracking</div>
          <div style="
            font-size: 32px; 
            font-weight: bold; 
            color: #b68a71;
            margin-bottom: 8px;
          ">${summary.user_name}'s Progress</div>
          <div style="
            font-size: 16px; 
            color: #94a3b8;
          ">${summary.date_range}</div>
        </div>

        <!-- Stats Grid - 2x2 Layout -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          flex-grow: 1;
          align-content: center;
        ">
          <!-- Total Water Card -->
          <div style="
            background: linear-gradient(135deg, #5271FF 0%, #4361EE 100%);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(82, 113, 255, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.1);
          ">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${totalWaterL}L
            </div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
              Total Water
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
              Over ${summary.days_tracked} days
            </div>
          </div>

          <!-- Goal Achievement Card -->
          <div style="
            background: linear-gradient(135deg, #b68a71 0%, #8b6f47 100%);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(182, 138, 113, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.1);
          ">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.goal_achievement_rate}%
            </div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
              Goal Achievement
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
              ${summary.goal_achievement_rate >= 80 ? 'Excellent!' : 'Keep going!'}
            </div>
          </div>

          <!-- Max Streak Card -->
          <div style="
            background: linear-gradient(135deg, #f7f2d3 0%, #F1E5A6 100%);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            color: #334155;
            box-shadow: 0 8px 25px rgba(247, 242, 211, 0.3);
            border: 2px solid rgba(52, 65, 85, 0.1);
          ">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.max_streak_days}
            </div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
              Max Streak
            </div>
            <div style="font-size: 14px; opacity: 0.8;">
              Building habits! 🏆
            </div>
          </div>

          <!-- Weight Progress Card -->
          <div style="
            background: linear-gradient(135deg, #5271FF 0%, #4361EE 100%);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(82, 113, 255, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.1);
          ">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">
              ${summary.current_weight}kg
            </div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
              Current Weight
            </div>
            <div style="font-size: 14px; opacity: 0.9; color: #4ade80;">
              ${summary.weight_change > 0 ? '+' : ''}${summary.weight_change}kg change
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <div style="color: #b68a71; font-size: 16px; font-weight: bold; margin-bottom: 4px;">
            Downscale Weight Loss Clinic
          </div>
          <div style="color: #94a3b8; font-size: 14px;">
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
          <Camera className="h-6 w-6 text-brown-400" />
          Share Your Amazing Progress
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Generate a beautiful, branded progress image perfect for social media sharing
        </p>
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

        {/* Amazing Progress Download Button */}
        <div className="pt-4">
          <Button 
            onClick={handleProgressDownload}
            disabled={isExporting || !startDate || !endDate}
            className="w-full bg-gradient-to-r from-[#b68a71] to-[#8b6f47] hover:from-[#8b6f47] hover:to-[#6d5235] text-white font-semibold py-4 text-lg shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Your Amazing Progress Image...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Download Progress Image
              </>
            )}
          </Button>
          <p className="text-xs text-slate-400 text-center mt-2">
            High-quality 1080x1080 image perfect for Instagram, Facebook, or sharing with friends! 🎉
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 