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

  const handleSip = async () => {
    setIsLogging(true);
    try {
      await onLogWater(sipAmount);
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
      {/* Quick Sip Button */}
      <Card className="bg-gradient-to-br from-hydration-500/20 to-hydration-600/10 border-hydration-400/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-hydration-400" />
            Quick Sip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSip}
            disabled={isLogging}
            className="w-full bg-gradient-to-r from-hydration-500 to-hydration-600 hover:from-hydration-600 hover:to-hydration-700 text-white py-6 text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-hydration-500/25"
          >
            {isLogging ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Logging...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Droplets className="h-6 w-6" />
                Sip {sipAmount}ml
              </div>
            )}
          </Button>
          <p className="text-xs text-slate-400 text-center mt-2">
            Quick log for small sips
          </p>
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
              className="w-full bg-slate-600 hover:bg-slate-500 text-white"
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