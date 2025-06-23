'use client';

import { useState } from 'react';
import { useBodyMetrics } from '@/contexts/BodyMetricsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Weight } from 'lucide-react';

export function BodyMetricsForm() {
  const { addMetricEntry, latestMetrics } = useBodyMetrics();
  const { toast } = useToast();
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightKg = parseFloat(weight);
    const waistCm = parseFloat(waist);

    if (isNaN(weightKg) || isNaN(waistCm) || weightKg <= 0 || waistCm <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter valid numbers for weight and waist.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addMetricEntry({ weight_kg: weightKg, waist_cm: waistCm });
      toast({
        title: 'Success!',
        description: 'Your new body metrics have been saved.',
      });
      setWeight('');
      setWaist('');
    } catch (error) {
      console.error('Failed to save body metrics:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your metrics. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Weight className="w-5 h-5" />
          Log Body Metrics
        </CardTitle>
        <CardDescription>Enter your latest measurements to track your progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                placeholder={latestMetrics ? `${latestMetrics.weight_kg}` : 'e.g., 75.5'}
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input 
                id="waist" 
                type="number" 
                value={waist} 
                onChange={(e) => setWaist(e.target.value)} 
                placeholder={latestMetrics ? `${latestMetrics.waist_cm}` : 'e.g., 80'}
                step="0.1"
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Save Metrics'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
