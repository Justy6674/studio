'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Info } from 'lucide-react';
import { DrinkType } from '@/lib/types';

interface OtherDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (drinkType: string, drinkName: string, amount: number, hydrationPercentage: number) => void;
}

const PRESET_DRINKS: DrinkType[] = [
  {
    id: 'soda_water',
    name: 'Soda Water / Sparkling Water',
    icon: '🥤',
    hydrationPercentage: 100,
    description: 'Counts fully towards your hydration goal'
  },
  {
    id: 'protein_water',
    name: 'Protein Water',
    icon: '🍼',
    hydrationPercentage: 100,
    description: 'Counts fully towards your hydration goal'
  },
  {
    id: 'herbal_tea',
    name: 'Herbal Tea',
    icon: '🍵',
    hydrationPercentage: 100,
    description: 'Counts fully towards your hydration goal'
  },
  {
    id: 'soup_broth',
    name: 'Soup / Broth',
    icon: '🍲',
    hydrationPercentage: 90,
    description: 'Counts 90% towards your hydration goal'
  },
  {
    id: 'fruit',
    name: 'Fruit (Watermelon, Cucumber Water)',
    icon: '🍉',
    hydrationPercentage: 80,
    description: 'Counts 80% towards your hydration goal'
  },
  {
    id: 'other',
    name: 'Other (Custom)',
    icon: '➕',
    hydrationPercentage: 100,
    description: 'Enter your own drink type'
  }
];

export default function OtherDrinkModal({ isOpen, onClose, onConfirm }: OtherDrinkModalProps) {
  const [selectedDrink, setSelectedDrink] = useState<DrinkType | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedDrink || !amount) return;
    
    const drinkName = selectedDrink.id === 'other' ? customName : selectedDrink.name;
    if (selectedDrink.id === 'other' && !customName.trim()) return;
    
    onConfirm(
      selectedDrink.id,
      drinkName,
      parseInt(amount),
      selectedDrink.hydrationPercentage
    );
    
    // Reset form
    setSelectedDrink(null);
    setAmount('');
    setCustomName('');
    setShowInfo(null);
  };

  const handleClose = () => {
    setSelectedDrink(null);
    setAmount('');
    setCustomName('');
    setShowInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl text-slate-100">Log Other Drink</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Drink Type Selection */}
          <div className="space-y-3">
            <Label className="text-slate-200">Choose Drink Type</Label>
            <div className="grid gap-2">
              {PRESET_DRINKS.map((drink) => (
                <div key={drink.id} className="relative">
                  <Button
                    variant={selectedDrink?.id === drink.id ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto p-3 ${
                      selectedDrink?.id === drink.id
                        ? 'bg-hydration-500 text-white border-hydration-400'
                        : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedDrink(drink)}
                  >
                    <span className="text-lg mr-3">{drink.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{drink.name}</div>
                      <div className="text-xs opacity-75">
                        {drink.hydrationPercentage}% hydration value
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-100 p-1 h-6 w-6"
                    onClick={() => setShowInfo(showInfo === drink.id ? null : drink.id)}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                  
                  {showInfo === drink.id && (
                    <div className="mt-2 p-2 bg-slate-700 rounded text-xs text-slate-300">
                      {drink.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Name Input (for "Other" option) */}
          {selectedDrink?.id === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customName" className="text-slate-200">
                Drink Name
              </Label>
              <Input
                id="customName"
                type="text"
                placeholder="e.g., Green Tea, Coffee, etc."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Amount Input */}
          {selectedDrink && (
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-200">
                Amount (ml)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                min="1"
                max="2000"
              />
              {selectedDrink && amount && (
                <div className="text-xs text-slate-400">
                  Hydration value: {Math.round(parseInt(amount) * (selectedDrink.hydrationPercentage / 100))}ml
                  {selectedDrink.hydrationPercentage < 100 && 
                    ` (${selectedDrink.hydrationPercentage}% of ${amount}ml)`
                  }
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDrink || !amount || (selectedDrink.id === 'other' && !customName.trim())}
              className="flex-1 bg-hydration-500 hover:bg-hydration-600 text-white"
            >
              Log Drink
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 