'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useHydration } from '@/contexts/HydrationContext';
import { useGemini } from '@/hooks/useGemini';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const PRESET_AMOUNTS = [
  { value: 250, label: 'Small (250ml)' },
  { value: 500, label: 'Medium (500ml)' },
  { value: 750, label: 'Large (750ml)' },
];

type HydrationLogModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HydrationLogModal({ isOpen, onClose }: HydrationLogModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const { logHydration, isLoading, error } = useHydration();
  const { toast } = useToast();
  const { triggerGeminiMotivation } = useGemini();

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedPreset('');
    }
  }, [isOpen]);

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

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setAmount(value);
      setSelectedPreset('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount of water in milliliters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const amountNum = Number(amount);
      await logHydration(amountNum);
      
      // Show success toast
      toast({
        title: 'Hydration logged!',
        description: `Successfully logged ${amount}ml of water.`,
      });

      // Trigger Gemini AI motivation
      await triggerGeminiMotivation(amountNum);
      
      // Close modal
      onClose();
    } catch (err) {
      // Error is handled by the context
      console.error('Error in handleSubmit:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Water Intake</DialogTitle>
          <DialogDescription>
            Track your hydration by entering the amount of water you've consumed.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-amount">Quick Select</Label>
              <Select onValueChange={handlePresetSelect} value={selectedPreset}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a preset amount" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_AMOUNTS.map((preset) => (
                    <SelectItem key={preset.value} value={String(preset.value)}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-amount">Or enter custom amount (ml)</Label>
                <span className="text-xs text-muted-foreground">
                  {amount ? `${Number(amount).toLocaleString()} ml` : ''}
                </span>
              </div>
              <Input
                id="custom-amount"
                type="text"
                inputMode="numeric"
                placeholder="e.g., 300"
                value={amount}
                onChange={handleCustomAmountChange}
                className="mt-1"
              />
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
            <Button type="submit" disabled={!amount || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                'Log Water'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
