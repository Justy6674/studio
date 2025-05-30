"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus } from "lucide-react";

interface LogWaterFormProps {
  onLogWater: (amount: number) => Promise<void>;
}

export function LogWaterForm({ onLogWater }: LogWaterFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("250");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to log water." });
      return;
    }

    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Enter a valid positive number for amount." });
      return;
    }

    setIsLoading(true);
    try {
      await onLogWater(numericAmount);
      setAmount("250"); // Reset to default after successful log
    } catch (error) {
      console.error("Error in LogWaterForm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = parseInt(amount, 10) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    setAmount(newAmount.toString());
  };

  const setQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  return (
    <div className="space-y-4">
      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[250, 500, 750, 1000].map((quickAmount) => (
          <Button
            key={quickAmount}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmount(quickAmount.toString())}
            className="text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200"
          >
            {quickAmount}ml
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-slate-300 text-sm">
            Custom Amount (ml)
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            max="5000"
            className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-hydration-400"
            required
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-hydration-500 hover:bg-hydration-600 text-white font-medium"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Logging...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Log Water
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}