"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassWater } from 'lucide-react';

interface HydrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const presetAmounts = [250, 500, 750, 1000];

const HydrationModal: React.FC<HydrationModalProps> = ({ isOpen, onClose }) => {
  const [customAmount, setCustomAmount] = React.useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <GlassWater className="mr-2 h-5 w-5 text-blue-500" />
            Log Your Hydration
          </DialogTitle>
          <DialogDescription>
            Select a preset amount or enter a custom value in milliliters (ml).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {presetAmounts.map((amount) => (
              <Button key={amount} variant="outline">
                {amount} ml
              </Button>
            ))}
          </div>
          <div className="relative">
            <Input
              id="custom-amount"
              placeholder="Or enter a custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">
            Log Water
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HydrationModal;
