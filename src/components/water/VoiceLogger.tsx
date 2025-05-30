"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceLoggerProps {
  onLogWater: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export function VoiceLogger({ onLogWater, isLoading }: VoiceLoggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check if Speech Recognition is supported
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = async (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      setTranscript(transcript);

      // Parse the amount from speech
      const amount = parseVoiceInput(transcript);
      if (amount) {
        try {
          await onLogWater(amount);
          toast({
            title: "Voice Logged! 🎤",
            description: `Successfully logged ${amount}ml from voice input: "${transcript}"`,
          });
        } catch (error) {
          console.error("Error logging water via voice:", error);
          toast({
            variant: "destructive",
            title: "Voice Log Failed",
            description: "Could not log water. Please try again or use manual input.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Could Not Parse Amount",
          description: `Could not understand amount from: "${transcript}". Try saying "Add 250ml" or "Drank a glass".`,
        });
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      let errorMessage = "Speech recognition failed";
      switch (event.error) {
        case 'no-speech':
          errorMessage = "No speech detected. Please try again.";
          break;
        case 'audio-capture':
          errorMessage = "Microphone not accessible. Please check permissions.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone permission denied. Please enable microphone access.";
          break;
        case 'network':
          errorMessage = "Network error. Please check your internet connection.";
          break;
      }
      
      toast({
        variant: "destructive",
        title: "Voice Recognition Error",
        description: errorMessage,
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return true;
  }, [onLogWater, toast]);

  // Parse voice input to extract water amount
  const parseVoiceInput = (text: string): number | null => {
    const normalizedText = text.toLowerCase().trim();
    
    // Common patterns to match
    const patterns = [
      // Direct ml amounts: "add 250ml", "log 300 ml", "drank 500ml"
      /(?:add|log|drank|drink|had)\s*(\d+)\s*ml/,
      /(\d+)\s*ml/,
      /(\d+)\s*millilitres?/,
      
      // Litres: "add 1 litre", "drank 0.5 litres"
      /(?:add|log|drank|drink|had)\s*(\d+(?:\.\d+)?)\s*litres?/,
      /(\d+(?:\.\d+)?)\s*litres?/,
      
      // Common phrases
      /(?:a\s+)?glass/,
      /(?:a\s+)?cup/,
      /(?:a\s+)?bottle/,
      /(?:a\s+)?sip/,
    ];

    // Check for direct ml/litre amounts
    for (const pattern of patterns.slice(0, 5)) {
      const match = normalizedText.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (pattern.toString().includes('litre')) {
          return Math.round(amount * 1000); // Convert litres to ml
        }
        return Math.round(amount);
      }
    }

    // Check for common phrases and map to approximate amounts
    if (normalizedText.includes('glass')) {
      return 250; // Standard glass
    }
    if (normalizedText.includes('cup')) {
      return 200; // Standard cup
    }
    if (normalizedText.includes('bottle')) {
      return 500; // Standard bottle
    }
    if (normalizedText.includes('sip')) {
      return 50; // Small sip
    }

    // Try to extract any number and assume it's ml
    const numberMatch = normalizedText.match(/(\d+)/);
    if (numberMatch) {
      const amount = parseInt(numberMatch[1]);
      // Reasonable range check
      if (amount >= 10 && amount <= 2000) {
        return amount;
      }
    }

    return null;
  };

  const startListening = () => {
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Voice Not Supported",
        description: "Speech recognition is not supported in this browser. Please use manual input.",
      });
      return;
    }

    if (!recognitionRef.current && !initSpeechRecognition()) {
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        variant: "destructive",
        title: "Voice Recognition Error",
        description: "Could not start voice recognition. Please try again.",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <Alert className="bg-slate-700/50 border-slate-600">
        <Volume2 className="h-4 w-4" />
        <AlertDescription className="text-slate-400">
          Voice logging is not supported in this browser. Please use manual input.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={isListening ? stopListening : startListening}
        disabled={isLoading}
        variant={isListening ? "destructive" : "outline"}
        className={`w-full ${
          isListening 
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
            : "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
        }`}
      >
        {isListening ? (
          <div className="flex items-center gap-2">
            <MicOff className="h-4 w-4" />
            Listening... (Tap to stop)
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Log by Voice
          </div>
        )}
      </Button>

      {transcript && (
        <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
          <p className="text-sm text-slate-400 mb-1">Voice Input:</p>
          <p className="text-slate-200 italic">"{transcript}"</p>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p>💡 Try saying:</p>
        <div className="grid grid-cols-2 gap-1 text-slate-400">
          <span>• "Add 250ml"</span>
          <span>• "Drank a glass"</span>
          <span>• "Log 500ml"</span>
          <span>• "Had a bottle"</span>
        </div>
      </div>
    </div>
  );
} 