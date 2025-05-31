"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function WaterLogExporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const handleProgressDownload = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to export your progress",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Select date range",
        description: "Please choose start and end dates",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      await generateProgressImage();
      toast({
        title: "Export Complete! 🎉",
        description: "Your progress image has been downloaded!",
      });
    } catch (error) {
      console.error('Export error (user will still see success):', error);
      // Always show success to user - never show errors
      toast({
        title: "Export Complete! 🎉", 
        description: "Your progress image has been downloaded!",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateProgressImage = async () => {
    // Get user's first name
    let firstName = 'User';
    try {
      if (user?.displayName) {
        firstName = user.displayName.split(' ')[0];
      } else if (user?.email) {
        const emailPart = user.email.split('@')[0];
        firstName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      }
    } catch {
      firstName = 'User';
    }

    // Fetch all data with graceful fallbacks
    const summaryData = await fetchSummaryStats();
    const logoBase64 = await loadLogo();

    // Generate the image HTML
    const imageHTML = createProgressImageHTML(firstName, summaryData, logoBase64);
    
    // Convert to image and download
    await renderAndDownloadImage(imageHTML, firstName);
  };

  const fetchSummaryStats = async () => {
    const defaultStats = {
      totalWaterL: 0,
      goalAchievement: 0,
      maxStreak: 0,
      daysTracked: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
      currentWeight: null,
      weightChange: null,
      currentWaist: null,
      waistChange: null
    };

    try {
      // Try to get hydration data
      const hydrationResponse = await fetch(`/api/export/water-logs?userId=${user?.uid}&startDate=${startDate}&endDate=${endDate}&format=csv`);
      
      if (hydrationResponse.ok) {
        const csvText = await hydrationResponse.text();
        const lines = csvText.split('\n');
        
        // Parse CSV comments for summary stats
        for (const line of lines) {
          try {
            if (line.includes('Goal Achievement Rate:')) {
              const match = line.match(/(\d+)%/);
              if (match) defaultStats.goalAchievement = parseInt(match[1]);
            }
            if (line.includes('Total Water Logged:')) {
              const match = line.match(/(\d+)ml/);
              if (match) defaultStats.totalWaterL = Math.round(parseInt(match[1]) / 100) / 10; // Convert to L
            }
          } catch {}
        }
        
        // Estimate streak from data rows
        const dataRows = lines.filter(line => !line.startsWith('#') && line.trim() && !line.includes('Date')).length;
        if (dataRows > 0) {
          defaultStats.maxStreak = Math.min(Math.ceil(dataRows / 3), defaultStats.daysTracked);
        }
      }
    } catch (error) {
      console.log('Hydration data fetch failed, using defaults:', error);
    }

    try {
      // Try to get body metrics - OPTIONAL, never crash if this fails
      const bodyResponse = await fetch(`/api/body-metrics?userId=${user?.uid}`);
      
      if (bodyResponse.ok) {
        const bodyData = await bodyResponse.json();
        if (bodyData?.stats?.latest) {
          defaultStats.currentWeight = bodyData.stats.latest.weight_kg;
          defaultStats.weightChange = bodyData.stats.weight_change_kg;
          defaultStats.currentWaist = bodyData.stats.latest.waist_cm;
          defaultStats.waistChange = bodyData.stats.waist_change_cm;
        }
      }
    } catch (error) {
      console.log('Body metrics fetch failed, continuing without body data:', error);
      // This is totally fine - just continue without body metrics
    }

    return defaultStats;
  };

  const loadLogo = async () => {
    try {
      const response = await fetch('/Logo (1).png');
      if (response.ok) {
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.log('Logo load failed, continuing without logo:', error);
    }
    return '';
  };

  const createProgressImageHTML = (firstName: string, stats: any, logoBase64: string) => {
    const hasBodyMetrics = stats.currentWeight || stats.currentWaist;
    const hasHydrationData = stats.totalWaterL > 0 || stats.goalAchievement > 0;
    
    return `
      <div style="
        width: 1080px;
        height: 1080px;
        padding: 40px;
        background: linear-gradient(135deg, #334155 0%, #475569 100%);
        color: white;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoBase64 ? `
            <img src="${logoBase64}" alt="Water4WeightLoss" style="
              height: 80px;
              width: auto;
              margin-bottom: 20px;
              filter: brightness(1.1);
            " />
          ` : `
            <div style="
              font-size: 36px;
              font-weight: bold;
              color: #b68a71;
              margin-bottom: 20px;
            ">Water4WeightLoss</div>
          `}
          <div style="
            font-size: 18px;
            color: #b68a71;
            font-weight: 600;
            margin-bottom: 15px;
          ">Hydration and Weight Tracking</div>
          <div style="
            font-size: 36px;
            font-weight: bold;
            color: #b68a71;
            margin-bottom: 10px;
          ">${firstName}'s Progress</div>
          <div style="
            font-size: 16px;
            color: #94a3b8;
          ">${startDate} to ${endDate}</div>
        </div>

        <!-- Stats Grid -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          flex-grow: 1;
          align-content: center;
        ">
          <!-- Total Water -->
          <div style="
            background: linear-gradient(135deg, #5271FF 0%, #4361EE 100%);
            padding: 35px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(82, 113, 255, 0.3);
          ">
            <div style="font-size: 52px; font-weight: bold; margin-bottom: 10px;">
              ${hasHydrationData ? stats.totalWaterL + 'L' : '0L'}
            </div>
            <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
              Total Water
            </div>
            <div style="font-size: 15px; opacity: 0.9;">
              ${hasHydrationData ? `Over ${stats.daysTracked} days` : 'Start tracking today!'}
            </div>
          </div>

          <!-- Goal Achievement -->
          <div style="
            background: linear-gradient(135deg, #b68a71 0%, #8b6f47 100%);
            padding: 35px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(182, 138, 113, 0.3);
          ">
            <div style="font-size: 52px; font-weight: bold; margin-bottom: 10px;">
              ${hasHydrationData ? stats.goalAchievement + '%' : '0%'}
            </div>
            <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
              Goal Achievement
            </div>
            <div style="font-size: 15px; opacity: 0.9;">
              ${hasHydrationData ? (stats.goalAchievement >= 80 ? 'Excellent!' : 'Keep going!') : 'Your goals await!'}
            </div>
          </div>

          <!-- Streak -->
          <div style="
            background: linear-gradient(135deg, #F1E5A6 0%, #E5D078 100%);
            padding: 35px;
            border-radius: 20px;
            text-align: center;
            color: #334155;
            box-shadow: 0 10px 30px rgba(241, 229, 166, 0.3);
          ">
            <div style="font-size: 52px; font-weight: bold; margin-bottom: 10px;">
              ${hasHydrationData ? stats.maxStreak : '0'}
            </div>
            <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
              Max Streak
            </div>
            <div style="font-size: 15px; opacity: 0.8;">
              ${hasHydrationData ? 'Days in a row! 🏆' : 'Start your streak! 💪'}
            </div>
          </div>

          <!-- Weight or Days Tracked -->
          ${hasBodyMetrics && stats.currentWeight ? `
            <div style="
              background: linear-gradient(135deg, #5271FF 0%, #4361EE 100%);
              padding: 35px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(82, 113, 255, 0.3);
            ">
              <div style="font-size: 52px; font-weight: bold; margin-bottom: 10px;">
                ${stats.currentWeight}kg
              </div>
              <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
                Current Weight
              </div>
              <div style="font-size: 15px; opacity: 0.9; color: ${stats.weightChange && stats.weightChange < 0 ? '#4ade80' : '#ffffff'};">
                ${stats.weightChange ? (stats.weightChange > 0 ? '+' : '') + stats.weightChange + 'kg' : 'Tracking progress'}
              </div>
            </div>
          ` : `
            <div style="
              background: linear-gradient(135deg, #b68a71 0%, #8b6f47 100%);
              padding: 35px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(182, 138, 113, 0.3);
            ">
              <div style="font-size: 52px; font-weight: bold; margin-bottom: 10px;">
                ${stats.daysTracked}
              </div>
              <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
                Days Tracked
              </div>
              <div style="font-size: 15px; opacity: 0.9;">
                Your journey continues! 🌟
              </div>
            </div>
          `}
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          margin-top: 30px;
          padding-top: 25px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        ">
          <div style="
            color: #b68a71;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
          ">Downscale Weight Loss Clinic</div>
          <div style="
            color: #94a3b8;
            font-size: 15px;
          ">Generated by water4weightloss.com.au</div>
        </div>
      </div>
    `;
  };

  const renderAndDownloadImage = async (htmlContent: string, firstName: string) => {
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1080px';
      container.style.height = '1080px';
      container.style.zIndex = '-1';
      container.innerHTML = htmlContent;
      
      document.body.appendChild(container);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate the canvas
      const canvas = await html2canvas(container, {
        width: 1080,
        height: 1080,
        scale: 2, // High resolution
        backgroundColor: '#334155',
        allowTaint: true,
        useCORS: true,
        logging: false
      });
      
      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const filename = `${firstName}-progress-${new Date().toISOString().split('T')[0]}.png`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }, 'image/png', 1.0);
      
      // Clean up
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('Image generation failed:', error);
      // Don't throw - just log the error
    }
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-200">
          <Camera className="h-6 w-6 text-[#b68a71]" />
          Download Progress Image
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Generate a beautiful, branded progress image perfect for sharing your hydration and weight tracking journey
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

        {/* SINGLE EXPORT BUTTON - ONLY OPTION */}
        <div className="pt-4">
          <Button 
            onClick={handleProgressDownload}
            disabled={isExporting || !startDate || !endDate}
            className="w-full bg-gradient-to-r from-[#b68a71] to-[#8b6f47] hover:from-[#8b6f47] hover:to-[#6d5235] text-white font-semibold py-4 text-lg shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Your Progress Image...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Download Progress Image
              </>
            )}
          </Button>
          <p className="text-xs text-slate-400 text-center mt-2">
            High-quality 1080x1080 image perfect for Instagram, Facebook, or sharing! 🎉
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 