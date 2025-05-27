
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";

interface LogWaterFormProps {
  onLogSuccess?: () => void;
}

export function LogWaterForm({ onLogSuccess }: LogWaterFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("250");
  const [isLoading, setIsLoading] = useState(false);
  const firebaseFunctions = getFunctions();

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
    const logHydrationFn = httpsCallable(firebaseFunctions, 'logHydration');

    try {
      const result = await logHydrationFn({
        amount: numericAmount,
        timestamp: new Date().toISOString()
      });

      toast({ title: "Success!", description: (result.data as any)?.message || `${numericAmount}ml logged.` });
      setAmount("250");
      if (onLogSuccess) {
        onLogSuccess();
      }
    } catch (err: any) {
      console.error("Log hydration failed:", err);
      toast({ variant: "destructive", title: "Error logging water", description: err.message || "Failed to log hydration." });
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

  const quickAmounts = [250, 500, 750, 1000];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
            onClick={() => adjustAmount(-50)}
            disabled={isLoading}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            required
            className="text-center text-lg h-10 bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
            onClick={() => adjustAmount(50)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {quickAmounts.map((quickAmount) => (
            <Button
              key={quickAmount}
              type="button"
              variant="outline"
              className="h-8 text-sm bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300 hover:text-slate-100"
              onClick={() => setQuickAmount(quickAmount)}
              disabled={isLoading}
            >
              {quickAmount}ml
            </Button>
          ))}
        </div>

        <Button 
          type="submit" 
          className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium" 
          disabled={isLoading || !user}
        >
          {isLoading ? "Logging..." : "Log Water"}
        </Button>
      </form>
    </div>
  );
}
