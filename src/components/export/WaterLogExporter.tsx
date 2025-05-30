"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Calendar, FileText, FileSpreadsheet, Scale, Droplets } from "lucide-react";
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

      if (format === 'json') {
        // For JSON, show preview or download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive-export-${user.uid}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For CSV, direct download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive-export-${user.uid}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Export Successful! 📁",
        description: `Your ${includeBodyMetrics && (includeWeight || includeWaist) ? 'comprehensive' : 'hydration'} data has been downloaded as ${format.toUpperCase()}.`,
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
          <Download className="h-6 w-6 text-brown-400" />
          Export Your Data
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
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel/Sheets)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (Data Analysis)
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

        {/* Export Info */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">📊 What's Included:</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• All water intake logs with timestamps</li>
            <li>• Daily totals and goal progress</li>
            <li>• Streak calculations and statistics</li>
            <li>• Summary analytics and achievement rates</li>
            <li>• Goal achievement tracking</li>
            {includeBodyMetrics && (includeWeight || includeWaist) && (
              <>
                <li className="text-brown-300">• Body metrics data:</li>
                {includeWeight && <li className="ml-4 text-brown-300">- Weight measurements with trends</li>}
                {includeWaist && <li className="ml-4 text-brown-300">- Waist measurements with progress</li>}
              </>
            )}
          </ul>
          {includeBodyMetrics && (!includeWeight && !includeWaist) && (
            <p className="text-xs text-slate-400 mt-2">
              💡 Select weight and/or waist to include body metrics data
            </p>
          )}
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !startDate || !endDate}
          className="w-full bg-brown-600 hover:bg-brown-700 text-white"
        >
          {isExporting ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-pulse" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {includeBodyMetrics && (includeWeight || includeWaist) ? 'Comprehensive' : 'Hydration'} Data
            </>
          )}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-slate-500 text-center">
          Your data is exported securely and remains private. 
          Exports contain only your personal hydration logs.
        </p>
      </CardContent>
    </Card>
  );
} 