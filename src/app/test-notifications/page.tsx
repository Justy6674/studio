"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Bell, 
  Droplets, 
  Target, 
  Zap, 
  PlayCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { notificationTypes, availableTones } from '@/lib/types';

export default function TestNotificationsPage() {
  const [selectedTone, setSelectedTone] = useState('funny');
  const [selectedType, setSelectedType] = useState('drink');
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async (testType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          tone: selectedTone,
          notificationType: selectedType
        })
      });

      const result = await response.json();
      setTestResults(result);
      
      if (result.success) {
        toast({
          title: "Test Completed! 🎉",
          description: `${testType} test completed successfully`
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🧪 Enhanced Notification System Test</h1>
        <p className="text-lg text-muted-foreground">
          Test the new granular notification types and day-splitting features
        </p>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        <span>{type.emoji}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI Tone</label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTones.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      <span className="capitalize">{tone}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => handleTest('fcm')}
          disabled={isLoading}
          className="h-20 flex flex-col gap-2"
        >
          <Bell className="h-6 w-6" />
          Test FCM
        </Button>
        
        <Button
          onClick={() => handleTest('gemini')}
          disabled={isLoading}
          className="h-20 flex flex-col gap-2"
          variant="outline"
        >
          <Droplets className="h-6 w-6" />
          Test AI
        </Button>
        
        <Button
          onClick={() => handleTest('day-split')}
          disabled={isLoading}
          className="h-20 flex flex-col gap-2"
          variant="outline"
        >
          <Target className="h-6 w-6" />
          Test Day Split
        </Button>
        
        <Button
          onClick={() => handleTest('all')}
          disabled={isLoading}
          className="h-20 flex flex-col gap-2"
          variant="default"
        >
          <PlayCircle className="h-6 w-6" />
          Test All
        </Button>
      </div>

      {/* Notification Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTypes.map((type) => (
              <div key={type.type} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.emoji}</span>
                  <h3 className="font-medium">{type.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
                {type.defaultAmount && (
                  <Badge variant="outline">{type.defaultAmount}ml</Badge>
                )}
                {type.defaultInterval && (
                  <Badge variant="outline">{type.defaultInterval} min</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Splitting Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Day Splitting Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Break your day into hydration milestones with confetti celebrations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium">Morning Target</h3>
                <p className="text-2xl font-bold">10:00 AM</p>
                <p className="text-sm text-muted-foreground">1,000ml target</p>
                <Badge className="mt-2">🎉 Confetti</Badge>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium">Afternoon Target</h3>
                <p className="text-2xl font-bold">3:00 PM</p>
                <p className="text-sm text-muted-foreground">2,000ml target</p>
                <Badge className="mt-2">🎉 Confetti</Badge>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium">Evening Target</h3>
                <p className="text-2xl font-bold">8:00 PM</p>
                <p className="text-sm text-muted-foreground">3,000ml target</p>
                <Badge className="mt-2">🎉 Confetti</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">
                  ✅ {testResults.message}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Type: {testResults.notificationType} | Tone: {testResults.tone}
                </p>
              </div>

              {testResults.results && (
                <div className="space-y-3">
                  {Object.entries(testResults.results).map(([key, result]: [string, any]) => (
                    <div key={key} className="p-3 border rounded-lg">
                      <h4 className="font-medium capitalize mb-2">{key} Test</h4>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.sampleMessage && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Sample:</strong> {result.sampleMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-4">
                <strong>Timestamp:</strong> {testResults.timestamp}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">✅ Completed Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 6 granular notification types (sip, glass, walk, drink, herbal tea, milestone)</li>
                <li>• Custom interval settings per type</li>
                <li>• Day-splitting with milestone targets</li>
                <li>• Confetti celebrations for milestones</li>
                <li>• Enhanced Gemini AI prompts</li>
                <li>• Updated Firebase Cloud Functions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Key Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Body metrics tracking (Dashboard → Metrics tab)</li>
                <li>• 8 AI personality tones</li>
                <li>• Custom vibration patterns</li>
                <li>• Smartwatch support</li>
                <li>• Australian localisation</li>
                <li>• Comprehensive analytics logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 