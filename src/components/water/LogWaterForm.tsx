"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus, Coffee } from "lucide-react";

interface LogWaterFormProps {
  onLogWater: (amount: number) => Promise<void>;
}

export function LogWaterForm({ onLogWater }: LogWaterFormProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("250");
  const [isLogging, setIsLogging] = useState(false);
  const [isSipping, setIsSipping] = useState(false);

  const sipAmount = userProfile?.sipAmount || 50;

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

    setIsLogging(true);
    try {
      await onLogWater(numericAmount);
      setAmount("250"); // Reset to default after successful log
    } catch (error) {
      console.error("Error in LogWaterForm:", error);
    } finally {
      setIsLogging(false);
    }
  };

  const handleSip = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to log water." });
      return;
    }

    setIsSipping(true);
    try {
      await onLogWater(sipAmount);
      toast({ 
        title: "Sip Logged! 💧", 
        description: `Added ${sipAmount}ml to your hydration.`,
        duration: 2000
      });
    } catch (error) {
      console.error("Error in sip logging:", error);
    } finally {
      setIsSipping(false);
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
      {/* Quick Sip Button */}
      <div className="mb-4">
        <Button
          type="button"
          onClick={handleSip}
          disabled={isSipping || isLogging}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-105"
        >
          {isSipping ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Sipping...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Quick Sip ({sipAmount}ml)
            </div>
          )}
        </Button>
        <p className="text-xs text-slate-400 text-center mt-1">
          Quick log {sipAmount}ml • Customize in Settings
        </p>
      </div>

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
          disabled={isLogging || isSipping} 
          className="w-full bg-hydration-500 hover:bg-hydration-600 text-white font-medium"
        >
          {isLogging ? (
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