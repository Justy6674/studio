import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AIMotivationCardProps {
  motivation: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function AIMotivationCard({ motivation, isLoading, onRefresh }: AIMotivationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const functions = getFunctions();
  const [reminderSending, setReminderSending] = useState(false);

  const handleSendReminder = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "Please log in to send reminders.",
      });
      return;
    }

    setReminderSending(true);
    const sendReminderFn = httpsCallable(functions, "sendHydrationReminder");

    try {
      const result = await sendReminderFn();
      toast({
        title: "Reminder Sent!",
        description: result?.data?.message || "Hydration reminder sent successfully.",
      });
    } catch (error: any) {
      console.error("Error calling sendHydrationReminder function:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to send reminder.",
      });
    } finally {
      setReminderSending(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Lightbulb className="h-7 w-7 text-yellow-400" />
          AI Wisdom
        </CardTitle>
        <CardDescription>A little boost to keep you going!</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !motivation ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-lg italic text-foreground/90 min-h-[60px]">
            {motivation || "Stay hydrated and conquer your day!"}
          </p>
        )}

        <Button onClick={onRefresh} disabled={isLoading} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isLoading ? "Refreshing..." : "New Motivation"}
        </Button>

        <Button
          onClick={handleSendReminder}
          disabled={reminderSending || !user}
          variant="secondary"
          className="w-full"
        >
          <Bell className="mr-2 h-4 w-4" />
          {reminderSending ? "Sending..." : "Send Reminder (SMS)"}
        </Button>
      </CardContent>
    </Card>
  );
}
