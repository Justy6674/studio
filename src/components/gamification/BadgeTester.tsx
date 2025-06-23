"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { resetUserBadges, grantBadgeToUser } from '@/utils/badgeTestUtils';
import { availableBadges } from '@/components/gamification/BadgeSystem';

export function BadgeTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetBadges = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to reset badges",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetUserBadges(user.uid);
      toast({
        title: "Badges Reset",
        description: "All badges have been reset successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset badges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantBadge = async () => {
    if (!user?.uid || !selectedBadge) {
      toast({
        title: "Error",
        description: "You must be logged in and select a badge",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await grantBadgeToUser(user.uid, selectedBadge);
      toast({
        title: "Badge Granted",
        description: `Badge "${availableBadges.find(b => b.id === selectedBadge)?.name}" has been granted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant badge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Badge System Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="badge-select" className="text-sm font-medium">
            Select Badge to Grant
          </label>
          <Select
            disabled={isLoading || !user}
            value={selectedBadge}
            onValueChange={setSelectedBadge}
          >
            <SelectTrigger id="badge-select">
              <SelectValue placeholder="Select a badge" />
            </SelectTrigger>
            <SelectContent>
              {availableBadges.map((badge) => (
                <SelectItem key={badge.id} value={badge.id}>
                  {badge.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            onClick={handleGrantBadge}
            disabled={isLoading || !user || !selectedBadge}
            className="flex-1"
          >
            {isLoading ? "Granting..." : "Grant Selected Badge"}
          </Button>
          <Button
            onClick={handleResetBadges}
            disabled={isLoading || !user}
            variant="destructive"
            className="flex-1"
          >
            {isLoading ? "Resetting..." : "Reset All Badges"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
