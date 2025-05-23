"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logHydration } from "@/app/actions/hydration";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MinusCircle, GlassWater } from "lucide-react";

const PRESET_AMOUNTS = [250, 500, 750, 1000]; // in ml

export function LogWaterForm() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("250");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e?: FormEvent, presetAmount?: number) => {
    if (e) e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }

    const numericAmount = presetAmount || parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid amount." });
      return;
    }

    setIsLoading(true);
    const result = await logHydration(user.uid, numericAmount);
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Success!", description: `${numericAmount}ml logged.` });
      setAmount("250"); // Reset to default
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleAmountChange = (delta: number) => {
    setAmount(prev => String(Math.max(0, Number(prev) + delta)));
  }

  return (
    <Card className="w-full shadow-lg">
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
              <Button type="button" variant="outline" size="icon" onClick={() => handleAmountChange(-50)} disabled={isLoading}>
                <MinusCircle className="h-5 w-5" />
              </Button>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 250"
                required
                className="text-center text-lg h-12"
                disabled={isLoading}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => handleAmountChange(50)} disabled={isLoading}>
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map(preset => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                onClick={() => handleSubmit(undefined, preset)}
                disabled={isLoading}
                className="h-12 text-base"
              >
                {preset} ml
              </Button>
            ))}
          </div>
          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
            {isLoading ? "Logging..." : "Log Water"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
