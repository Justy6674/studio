"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceLogger } from "./VoiceLogger";
import { Plus, Droplets } from "lucide-react";

interface LogWaterFormProps {
  onLogWater: (amount: number) => Promise<void>;
  onOtherDrink?: () => void;
}

export function LogWaterForm({ onLogWater, onOtherDrink }: LogWaterFormProps) {
  const [amount, setAmount] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Quick-add drink options optimized for mobile standards
  const drinkOptions = [
    { name: "Quick Sip", amount: 50, emoji: "💧", color: "bg-purple-600 hover:bg-purple-700" },
    { name: "Small Glass", amount: 150, emoji: "🥛", color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Tall Glass", amount: 250, emoji: "🥛", color: "bg-cyan-600 hover:bg-cyan-700" },
    { name: "Water Bottle", amount: 450, emoji: "🧴", color: "bg-teal-600 hover:bg-teal-700" },
    { name: "Large Bottle", amount: 500, emoji: "🧴", color: "bg-blue-700 hover:bg-blue-800" },
    { name: "XL Bottle", amount: 600, emoji: "🧴", color: "bg-indigo-600 hover:bg-indigo-700" },
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
      {/* Quick Add Buttons - Modern Mobile Standards */}
      <Card className="bg-gradient-to-br from-hydration-500/20 to-hydration-600/10 border-hydration-400/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-hydration-400" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MOBILE OPTIMIZED - Vertical stack for 48px+ touch targets */}
          <div className="space-y-3">
            {drinkOptions.map((drink) => (
              <button
                key={`${drink.name}-${drink.amount}`}
                onClick={() => handleQuickAdd(drink.amount)}
                disabled={isLogging}
                className={`
                  ${drink.color}
                  w-full 
                  min-h-[64px] 
                  px-6 py-4
                  rounded-lg
                  text-white
                  font-semibold
                  shadow-md
                  transition-all duration-200
                  hover:shadow-lg
                  active:scale-95
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  flex items-center
                  text-left
                  border-0
                  outline-none
                  focus:ring-2 focus:ring-hydration-400 focus:ring-offset-2
                `}
                type="button"
              >
                {isLogging ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0"></div>
                    <span className="text-base font-medium">Adding...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 w-full">
                    <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
                      {drink.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-white">
                        {drink.name}
                      </div>
                      <div className="text-sm text-white/80">
                        {drink.amount}ml
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Other Drink Button */}
          {onOtherDrink && (
            <div className="border-t border-slate-600 pt-4">
              <button
                onClick={onOtherDrink}
                disabled={isLogging}
                className="
                  w-full 
                  min-h-[64px] 
                  px-6 py-4
                  rounded-lg
                  bg-transparent
                  border-2 border-[#b68a71]
                  text-[#b68a71]
                  font-semibold
                  transition-all duration-200
                  hover:bg-[#b68a71] hover:text-white
                  active:scale-95
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  flex items-center
                  text-left
                  outline-none
                  focus:ring-2 focus:ring-[#b68a71] focus:ring-offset-2
                "
                type="button"
              >
                <div className="flex items-center gap-4 w-full">
                  <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
                    🍹
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold">
                      Other Drink
                    </div>
                    <div className="text-sm opacity-80">
                      Juice, coffee, etc.
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
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
              <Label htmlFor="amount" className="text-slate-300 text-base font-medium">
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
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 mt-2 h-12 text-base"
                disabled={isLogging}
              />
            </div>
            <Button
              type="submit"
              disabled={!amount || isLogging}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white min-h-[48px] text-base font-medium"
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