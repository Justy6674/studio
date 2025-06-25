"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  prompt?: string;
  response_time_ms?: number;
  test_params?: unknown;
  gemini_config?: unknown;
  raw_response?: unknown;
  timestamp?: string;
}

const TONE_OPTIONS = [
  { value: "Default", label: "Default" },
  { value: "Clinical", label: "Clinical" },
  { value: "Funny", label: "Funny" },
  { value: "Crass", label: "Crass" },
  { value: "Sarcastic", label: "Sarcastic" },
  { value: "Warm", label: "Warm" },
  { value: "Kind", label: "Kind" },
  { value: "Educational", label: "Educational" },
];

const TEST_SCENARIOS = [
  { name: "First Time User", ml_logged: 0, goal: 2000, streak: 0 },
  { name: "Goal Achieved", ml_logged: 2000, goal: 2000, streak: 5 },
  { name: "Halfway Progress", ml_logged: 1000, goal: 2000, streak: 3 },
  { name: "Behind Schedule", ml_logged: 300, goal: 2000, streak: 1 },
  { name: "Super Achiever", ml_logged: 2500, goal: 2000, streak: 10 },
];

export function AIMotivationTester() {
  const { toast } = useToast();
  const [tone, setTone] = useState("Default");
  const [mlLogged, setMlLogged] = useState(500);
  const [goal, setGoal] = useState(2000);
  const [streak, setStreak] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunningBatch, setIsRunningBatch] = useState(false);

  const testGemini = async (customParams?: unknown) => {
    setIsLoading(true);
    try {
      const params = customParams || {
        tone,
        ml_logged_today: mlLogged,
        goal_ml: goal,
        current_streak: streak,
      };

      const response = await fetch('/api/admin/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      
      if (!customParams) {
        setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      }
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      if (!customParams) {
        setResults(prev => [errorResult, ...prev.slice(0, 9)]);
      }
      
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const runBatchTest = async () => {
    setIsRunningBatch(true);
    const batchResults: TestResult[] = [];
    
    try {
      // Test each tone with different scenarios
      for (const toneOption of TONE_OPTIONS) {
        for (const scenario of TEST_SCENARIOS.slice(0, 3)) { // Test 3 scenarios per tone
          const result = await testGemini({
            tone: toneOption.value,
            ml_logged_today: scenario.ml_logged,
            goal_ml: scenario.goal,
            current_streak: scenario.streak,
          });
          
          batchResults.push({
            ...result,
            test_name: `${toneOption.label} - ${scenario.name}`
          });
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setResults(batchResults);
      toast({
        title: "Batch Test Complete!",
        description: `Tested ${batchResults.length} combinations. Check results below.`,
      });
      
    } catch (error) {
      toast({
        title: "Batch Test Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsRunningBatch(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  const loadScenario = (scenario: typeof TEST_SCENARIOS[0]) => {
    setMlLogged(scenario.ml_logged);
    setGoal(scenario.goal);
    setStreak(scenario.streak);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            AI Motivation Testing Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Test Section */}
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Test</TabsTrigger>
              <TabsTrigger value="batch">Batch Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="tone">Motivation Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="mlLogged">ML Logged Today</Label>
                  <Input
                    id="mlLogged"
                    type="number"
                    value={mlLogged}
                    onChange={(e) => setMlLogged(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal">Daily Goal</Label>
                  <Input
                    id="goal"
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="streak">Current Streak</Label>
                  <Input
                    id="streak"
                    type="number"
                    value={streak}
                    onChange={(e) => setStreak(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              {/* Quick Scenario Buttons */}
              <div className="space-y-2">
                <Label>Quick Test Scenarios:</Label>
                <div className="flex flex-wrap gap-2">
                  {TEST_SCENARIOS.map((scenario, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadScenario(scenario)}
                      className="text-xs"
                    >
                      {scenario.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={() => testGemini()}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing Gemini...
                  </>
                ) : (
                  "Test Gemini AI"
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-slate-400">
                  This will test all tones with multiple scenarios (~24 API calls)
                </p>
                <Button
                  onClick={runBatchTest}
                  disabled={isRunningBatch}
                  className="w-full"
                  variant="secondary"
                >
                  {isRunningBatch ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Batch Test...
                    </>
                  ) : (
                    "Run Comprehensive Batch Test"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <Card className="bg-slate-800 border-slate-600">
          <CardHeader>
            <CardTitle className="text-slate-200">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                      <Badge variant={result.success ? "secondary" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                      {result.response_time_ms && (
                        <Badge variant="outline" className="text-slate-400">
                          <Clock className="mr-1 h-3 w-3" />
                          {result.response_time_ms}ms
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.success && result.message && (
                    <div>
                      <Label className="text-sm text-slate-400">Generated Message:</Label>
                      <div className="p-3 bg-slate-600 rounded-lg">
                        <p className="text-slate-100">{result.message}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.message!)}
                          className="mt-2 p-1 h-auto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {result.error && (
                    <div>
                      <Label className="text-sm text-red-400">Error:</Label>
                      <p className="text-red-300 text-sm">{result.error}</p>
                    </div>
                  )}
                  
                  {result.test_params && typeof result.test_params === 'object' ? (
                    <div>
                      <Label className="text-sm text-slate-400">Test Parameters:</Label>
                      <pre className="text-xs bg-slate-600 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.test_params, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                  
                  {result.prompt && (
                    <details className="text-sm">
                      <summary className="text-slate-400 cursor-pointer">View Prompt</summary>
                      <Textarea
                        value={result.prompt}
                        readOnly
                        className="mt-2 bg-slate-600 border-slate-500 text-xs"
                        rows={10}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.prompt!)}
                        className="mt-1"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy Prompt
                      </Button>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}