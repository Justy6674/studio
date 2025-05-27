
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet } from "lucide-react";

interface LogWaterFormProps {
  onLogSuccess?: () => void;
}

export function LogWaterForm({ onLogSuccess }: LogWaterFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
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
        timestamp: new Date().toISOString() // Send client timestamp
      });

      toast({ title: "Success!", description: (result.data as any)?.message || `${numericAmount}ml logged.` });
      setAmount("");
      if (onLogSuccess) {
        onLogSuccess(); // Call the callback to refresh dashboard data
      }
    } catch (err: any) {
      console.error("Log hydration failed:", err);
      toast({ variant: "destructive", title: "Error logging water", description: err.message || "Failed to log hydration." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
           <Droplet className="h-7 w-7 text-primary" />
          Log Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base">Amount (ml)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 250"
              required
              className="text-lg h-12"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !user}>
            {isLoading ? "Logging..." : "Add Water"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
