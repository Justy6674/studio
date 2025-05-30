"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  Ruler, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Edit,
  Trash2,
  Target,
  BarChart3,
  Minus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { BodyMetrics, BodyMetricsStats } from "@/lib/types";

export function BodyMetricsTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<BodyMetrics[]>([]);
  const [stats, setStats] = useState<BodyMetricsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  
  // Edit state
  const [editingEntry, setEditingEntry] = useState<BodyMetrics | null>(null);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/body-metrics?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setStats(data.stats);
      } else {
        throw new Error('Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load body metrics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!user || !weight || !waist) {
      toast({
        title: "Missing Information",
        description: "Please enter both weight and waist measurements.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingEntry(true);
    try {
      const response = await fetch('/api/body-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          weight_kg: parseFloat(weight),
          waist_cm: parseFloat(waist),
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success! 📊",
          description: "Body metrics logged successfully.",
        });
        
        // Reset form
        setWeight("");
        setWaist("");
        setNotes("");
        setIsDialogOpen(false);
        
        // Refresh data
        fetchMetrics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log metrics');
      }
    } catch (error) {
      console.error('Error adding metrics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log metrics.",
        variant: "destructive",
      });
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleEditEntry = async () => {
    if (!user || !editingEntry || !weight || !waist) return;

    setIsAddingEntry(true);
    try {
      const response = await fetch('/api/body-metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: editingEntry.id,
          userId: user.uid,
          weight_kg: parseFloat(weight),
          waist_cm: parseFloat(waist),
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Updated! ✏️",
          description: "Body metrics updated successfully.",
        });
        
        setEditingEntry(null);
        setWeight("");
        setWaist("");
        setNotes("");
        setIsDialogOpen(false);
        
        fetchMetrics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update metrics');
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update metrics.",
        variant: "destructive",
      });
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch(`/api/body-metrics?entryId=${entryId}&userId=${user.uid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted! 🗑️",
          description: "Body metrics entry deleted.",
        });
        fetchMetrics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete entry.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (entry: BodyMetrics) => {
    setEditingEntry(entry);
    setWeight(entry.weight_kg.toString());
    setWaist(entry.waist_cm.toString());
    setNotes(entry.notes || "");
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setWeight("");
    setWaist("");
    setNotes("");
  };

  const renderStatsCard = () => {
    if (!stats || !stats.latest) {
      return (
        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="p-6 text-center">
            <p className="text-slate-400">No data yet. Add your first measurement!</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <Card className="bg-gradient-to-br from-blue-800 to-blue-900 border-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Current Weight</p>
                <p className="text-2xl font-bold text-white">{stats.latest.weight_kg}kg</p>
              </div>
              <Scale className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        {/* Current Waist */}
        <Card className="bg-gradient-to-br from-purple-800 to-purple-900 border-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Current Waist</p>
                <p className="text-2xl font-bold text-white">{stats.latest.waist_cm}cm</p>
              </div>
              <Ruler className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>

        {/* Weight Change */}
        <Card className="bg-gradient-to-br from-green-800 to-green-900 border-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Weight Change</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-white">
                    {stats.weight_change_kg > 0 ? '+' : ''}{stats.weight_change_kg}kg
                  </p>
                  {stats.weight_change_kg > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-300" />
                  ) : stats.weight_change_kg < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-300" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waist Change */}
        <Card className="bg-gradient-to-br from-orange-800 to-orange-900 border-orange-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Waist Change</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-white">
                    {stats.waist_change_cm > 0 ? '+' : ''}{stats.waist_change_cm}cm
                  </p>
                  {stats.waist_change_cm > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-300" />
                  ) : stats.waist_change_cm < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-300" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Body Metrics</h2>
          <p className="text-slate-400">Track your weight and waist measurements</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-brown-600 hover:bg-brown-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-slate-200">
                {editingEntry ? 'Edit' : 'Add'} Body Metrics
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="75.5"
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Waist (cm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="85.0"
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling today?"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  rows={2}
                />
              </div>
              
              <Button
                onClick={editingEntry ? handleEditEntry : handleAddEntry}
                disabled={isAddingEntry || !weight || !waist}
                className="w-full bg-brown-600 hover:bg-brown-700"
              >
                {isAddingEntry ? "Saving..." : editingEntry ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {renderStatsCard()}

      {/* Additional Stats */}
      {stats && stats.total_entries > 1 && (
        <Card className="bg-slate-800 border-slate-600">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-200">{stats.total_entries}</p>
              <p className="text-sm text-slate-400">Total Entries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-200">{stats.trend_period_days}</p>
              <p className="text-sm text-slate-400">Days Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-200">{stats.avg_weight_kg}kg</p>
              <p className="text-sm text-slate-400">Avg Weight</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-200">{stats.avg_waist_cm}cm</p>
              <p className="text-sm text-slate-400">Avg Waist</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries History */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-200">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-400 text-center py-4">Loading...</p>
          ) : metrics.length === 0 ? (
            <p className="text-slate-400 text-center py-4">
              No entries yet. Add your first measurement to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-slate-200">
                        <span className="font-semibold">{entry.weight_kg}kg</span>
                        <span className="mx-2 text-slate-500">•</span>
                        <span className="font-semibold">{entry.waist_cm}cm</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-slate-400 mt-1">{entry.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(entry)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 