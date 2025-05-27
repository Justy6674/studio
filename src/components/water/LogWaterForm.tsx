
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GlassWater, CirclePlus, CircleMinus } from "lucide-react";
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <GlassWater className="h-7 w-7 text-primary" />
          Log Your Water Intake
        </CardTitle>
        <CardDescription>Add the amount of water you've consumed.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base">Amount (ml)</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => adjustAmount(-50)}
                disabled={isLoading}
              >
                <CircleMinus className="h-5 w-5" />
              </Button>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 250"
                required
                className="text-center text-lg h-12 md:text-sm"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => adjustAmount(50)}
                disabled={isLoading}
              >
                <CirclePlus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                className="h-12 text-base"
                onClick={() => setQuickAmount(quickAmount)}
                disabled={isLoading}
              >
                {quickAmount} ml
              </Button>
            ))}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg" 
            disabled={isLoading || !user}
          >
            {isLoading ? "Logging..." : "Log Water"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
