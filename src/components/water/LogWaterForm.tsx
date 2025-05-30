"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceLogger } from "./VoiceLogger";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Droplets } from "lucide-react";

interface LogWaterFormProps {
  onLogWater: (amount: number) => Promise<void>;
}

export function LogWaterForm({ onLogWater }: LogWaterFormProps) {
  const { userProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const sipAmount = userProfile?.sipAmount || 50;

  // Quick-add drink options with proper emoji icons and consistent colors
  const drinkOptions = [
    { name: "Small Glass", amount: 150, emoji: "🥛", color: "from-blue-500 to-blue-600" },
    { name: "Tall Glass", amount: 250, emoji: "🥛", color: "from-cyan-500 to-cyan-600" },
    { name: "Water Bottle", amount: 500, emoji: "🧴", color: "from-teal-500 to-teal-600" },
    { name: "Large Bottle", amount: 750, emoji: "🧴", color: "from-blue-600 to-blue-700" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const waterAmount = parseInt(amount);
    if (waterAmount > 0) {
      setIsLogging(true);
      try {
        await onLogWater(waterAmount);
        setAmount("");
      } finally {
        setIsLogging(false);
      }
    }
  };

  const handleQuickAdd = async (drinkAmount: number) => {
    setIsLogging(true);
    try {
      await onLogWater(drinkAmount);
    } finally {
      setIsLogging(false);
    }
  };

  const handleVoiceLog = async (voiceAmount: number) => {
    setIsLogging(true);
    try {
      await onLogWater(voiceAmount);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Buttons */}
      <Card className="bg-gradient-to-br from-hydration-500/20 to-hydration-600/10 border-hydration-400/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-hydration-400" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* All quick-add buttons - mobile stacked, desktop grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drinkOptions.map((drink) => (
              <Button
                key={drink.amount}
                onClick={() => handleQuickAdd(drink.amount)}
                disabled={isLogging}
                className={`bg-gradient-to-r ${drink.color} hover:scale-105 text-white py-4 px-4 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-lg w-full min-h-[50px] flex items-center justify-center`}
              >
                {isLogging ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span className="text-sm">Adding...</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {drink.emoji} {drink.name} ({drink.amount}ml)
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Quick Sip - Always full width */}
          <div className="border-t border-slate-600 pt-3">
            <Button
              onClick={() => handleQuickAdd(sipAmount)}
              disabled={isLogging}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-4 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-purple-500/25 min-h-[50px] flex items-center justify-center"
            >
              {isLogging ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span className="text-sm">Adding...</span>
                </div>
              ) : (
                <span className="text-sm font-medium whitespace-nowrap">
                  💧 Quick Sip ({sipAmount}ml)
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Plus className="h-5 w-5 text-slate-400" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-slate-300 text-sm">
                Amount (ml)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in ml"
                min="1"
                max="2000"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 mt-1"
                disabled={isLogging}
              />
            </div>
            <Button
              type="submit"
              disabled={!amount || isLogging}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white min-h-[44px]"
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
        </CardContent>
      </Card>

      {/* Voice Logger */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs">🎤</span>
            </div>
            Voice Logger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VoiceLogger onLogWater={handleVoiceLog} isLoading={isLogging} />
        </CardContent>
      </Card>
    </div>
  );
}