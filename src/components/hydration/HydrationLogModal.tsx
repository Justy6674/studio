'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, Coffee, Beer, Wine, Martini, Plus, History, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { useGemini } from '@/hooks/useGemini';
import { useHydration } from '@/contexts/HydrationContext';
import { useDrinkHistory } from '@/hooks/useDrinkHistory';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';
import type { DrinkHistoryItem } from '@/hooks/useDrinkHistory';

const PRESET_AMOUNTS = [
  { value: 250, label: 'Small Glass (250ml)', icon: Droplet },
  { value: 500, label: 'Medium Glass (500ml)', icon: Droplet },
  { value: 750, label: 'Large Glass (750ml)', icon: Droplet },
  { value: 350, label: 'Coffee Cup (350ml)', icon: Coffee },
];

const DRINK_TYPES = [
  { value: 'water', label: 'Water', icon: Droplet, hydrationFactor: 1.0 },
  { value: 'coffee', label: 'Coffee', icon: Coffee, hydrationFactor: 0.8 },
  { value: 'tea', label: 'Tea', icon: Coffee, hydrationFactor: 0.9 },
  { value: 'beer', label: 'Beer', icon: Beer, hydrationFactor: 0.2 },
  { value: 'cocktail', label: 'Cocktail', icon: Wine, hydrationFactor: 0.3 },
];

type HydrationLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HydrationLogModal({ isOpen, onClose }: HydrationLogModalProps) {
  const { recentDrinks, lastUsedDrinkType, lastUsedAmount, addToHistory } = useDrinkHistory();
  
  // Initialize states with last used values from history if available
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedDrinkType, setSelectedDrinkType] = useState(lastUsedDrinkType || 'water');
  const [previousPercentage, setPreviousPercentage] = useState(0);
  const [drinkTypeMenuOpen, setDrinkTypeMenuOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [waterLevelHeight, setWaterLevelHeight] = useState(0); // For water level animation

  const { logHydration, isLoading, error, hydrationPercentage } = useHydration();
  const { toast } = useToast();
  const { triggerGeminiMotivation } = useGemini();

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedPreset('');
      setPreviousPercentage(hydrationPercentage);
      
      // Default to last used drink type if available
      if (lastUsedDrinkType) {
        setSelectedDrinkType(lastUsedDrinkType);
      }
      
      // Suggest last used amount if available
      if (lastUsedAmount && lastUsedAmount > 0) {
        setAmount(String(lastUsedAmount));
      }
    }
  }, [isOpen, hydrationPercentage, lastUsedDrinkType, lastUsedAmount]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handlePresetSelect = (value: string) => {
    setSelectedPreset(value);
    setAmount(value);
  };

  const handleDrinkTypeSelect = (value: string) => {
    setSelectedDrinkType(value);
    setDrinkTypeMenuOpen(false);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setAmount(value);
      setSelectedPreset('');
    }
  };

  // Update the water level visualization when amount changes
  useEffect(() => {
    const numAmount = Number(amount) || 0;
    // Calculate height percentage based on amount (capped at 90%)
    const heightPercent = Math.min(90, Math.max(0, (numAmount / 1000) * 80));
    setWaterLevelHeight(heightPercent);
  }, [amount]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount in milliliters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Apply hydration factor based on drink type
      const amountNum = Number(amount);
      const drinkType = DRINK_TYPES.find(d => d.value === selectedDrinkType) || DRINK_TYPES[0];
      const adjustedAmount = Math.round(amountNum * drinkType.hydrationFactor);

      // Standard logHydration only takes amount, updated to support metadata
      await logHydration(adjustedAmount);
      
      // Save to drink history
      addToHistory(selectedDrinkType, amountNum);

      // Show success toast
      toast({
        title: 'Hydration logged!',
        description: `Added ${adjustedAmount}ml from ${drinkType.label} (${amountNum}ml).`,
      });

      // Trigger Gemini AI motivation
      await triggerGeminiMotivation(adjustedAmount);

      // Check for celebration triggers
      const newPercentage = hydrationPercentage;

      // Trigger confetti for crossing 50% or 100%
      if ((previousPercentage < 50 && newPercentage >= 50) ||
        (previousPercentage < 100 && newPercentage >= 100)) {
        setShowConfetti(true);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    }
  };

  // Get the current selected drink type data
  const currentDrinkType = DRINK_TYPES.find(d => d.value === selectedDrinkType) || DRINK_TYPES[0];
  const DrinkIcon = currentDrinkType.icon;

  return (
    <>
      <Confetti active={showConfetti} />
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DrinkIcon className="h-5 w-5 text-primary" />
              Log {currentDrinkType.label} Intake
            </DialogTitle>
            <DialogDescription>
              Track your hydration by entering the amount you've consumed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Recently Used Drinks - Only show if we have recent drinks */}
              {recentDrinks && recentDrinks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1">
                      <History className="h-3 w-3" /> 
                      <span>Recently Used</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">Quick select</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {recentDrinks.map((drink: DrinkHistoryItem, index: number) => {
                      const drinkType = DRINK_TYPES.find(d => d.value === drink.drinkType) || DRINK_TYPES[0];
                      const Icon = drinkType.icon;
                      return (
                        <motion.button
                          key={`${drink.drinkType}-${index}`}
                          type="button"
                          className="flex items-center justify-between p-2 border rounded-md hover:bg-accent"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedDrinkType(drink.drinkType);
                            setAmount(String(drink.amount));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span>{drinkType.label}</span>
                          </div>
                          <div className="text-sm font-medium">{drink.amount}ml</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Drink Type Selector */}
              <div>
                <Label htmlFor="drink-type">Drink Type</Label>
                <Select
                  onValueChange={handleDrinkTypeSelect}
                  value={selectedDrinkType}
                  onOpenChange={setDrinkTypeMenuOpen}
                  open={drinkTypeMenuOpen}
                >
                  <SelectTrigger className="mt-1">
                    <div className="flex items-center gap-2">
                      <DrinkIcon className="h-4 w-4 text-primary" />
                      <SelectValue placeholder="Select drink type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {DRINK_TYPES.map((drinkType) => {
                      const Icon = drinkType.icon;
                      return (
                        <SelectItem
                          key={drinkType.value}
                          value={drinkType.value}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span>{drinkType.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Preset Amounts with Swipe Gestures */}
              <div>
                <Label htmlFor="preset-amount">Quick Select</Label>
                <motion.div 
                  className="flex overflow-x-auto pb-2 mt-1 no-scrollbar"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                >
                  <div className="flex space-x-2 min-w-max">
                    {PRESET_AMOUNTS.map((preset) => (
                      <motion.div
                        key={preset.value}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0"
                      >
                        <Button
                          type="button"
                          variant={selectedPreset === String(preset.value) ? "default" : "outline"}
                          className="flex flex-col h-20 w-20 justify-center items-center gap-1"
                          onClick={() => handlePresetSelect(String(preset.value))}
                        >
                          <preset.icon className="h-5 w-5" />
                          <span className="text-xs">{preset.label.split(' ')[0]}</span>
                          <span className="font-medium">{preset.value}ml</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Custom Amount with Water Level Visualization */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-amount">Or enter custom amount (ml)</Label>
                  <span className="text-xs text-muted-foreground">
                    {amount ? `${Number(amount).toLocaleString()} ml` : ''}
                  </span>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="custom-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g., 300"
                    value={amount}
                    onChange={handleCustomAmountChange}
                    className="pr-12"
                  />
                  
                  {/* Water level visualization */}
                  <div className="absolute inset-y-0 right-0 w-10 h-full overflow-hidden rounded-r-md pointer-events-none">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500/20 transition-all duration-300 ease-in-out"
                      style={{ height: `${waterLevelHeight}%` }}
                    />
                    <Droplet className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-80" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!amount || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <DrinkIcon className="h-4 w-4" />
                    Log {currentDrinkType.label}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
