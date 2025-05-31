"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Heart, 
  TrendingDown, 
  Scale, 
  Ruler, 
  ExternalLink, 
  Star,
  User,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  FileText
} from 'lucide-react';

export function InfoCards() {
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-hydration-500/20 to-blue-600/10 border-hydration-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Droplets className="h-6 w-6 text-hydration-400" />
            Hydration & Weight Loss Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">
            Welcome to your comprehensive guide for hydration and weight loss success. 
            Whether you're on GLP-1 medications or following a structured weight loss program, 
            proper hydration is crucial for optimal results.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Supports metabolism</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Aids weight loss</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Reduces side effects</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight Loss Medication Support */}
      <Card className="bg-slate-800 border-[#b68a71]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#b68a71]">
            <Scale className="h-5 w-5" />
            Hydration for Weight Loss Medications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-400 mb-2">GLP-1 Medications & Hydration</h4>
                <p className="text-sm text-slate-300">
                  Medications like Ozempic, Wegovy, Mounjaro, and Zepbound can cause dehydration as a side effect. 
                  Proper hydration helps minimize nausea, constipation, and fatigue.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200">Hydration Tips for Medication Success:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                <span>Drink 500ml of water 30 minutes before meals to reduce nausea</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                <span>Sip small amounts throughout the day rather than large volumes at once</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                <span>Add electrolytes if experiencing dizziness or weakness</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                <span>Increase intake on injection days to help with potential side effects</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scientific Benefits */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <FileText className="h-5 w-5" />
            Science-Backed Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-400">Weight Loss Support</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Boosts metabolism by up to 30%</li>
                <li>• Reduces appetite and food cravings</li>
                <li>• Helps break weight loss plateaus</li>
                <li>• Supports fat breakdown (lipolysis)</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-400">General Health</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Improves energy and mental clarity</li>
                <li>• Reduces bloating and water retention</li>
                <li>• Supports kidney function</li>
                <li>• Enhances skin health and appearance</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              <strong>Clinical evidence:</strong> Studies show adequate hydration can increase weight loss by 
              2-3kg over 12 weeks compared to inadequate hydration groups.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Measurement Guide */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Ruler className="h-5 w-5" />
            Accurate Measurement Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-cyan-400">Common Container Sizes</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>🥛 Small glass</span>
                  <span>150ml</span>
                </div>
                <div className="flex justify-between">
                  <span>🥛 Standard glass</span>
                  <span>250ml</span>
                </div>
                <div className="flex justify-between">
                  <span>☕ Coffee mug</span>
                  <span>200-300ml</span>
                </div>
                <div className="flex justify-between">
                  <span>🧴 Small bottle</span>
                  <span>450-500ml</span>
                </div>
                <div className="flex justify-between">
                  <span>🧴 Large bottle</span>
                  <span>750ml-1L</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-400">Pro Tips</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Measure your favorite containers once for accuracy</li>
                <li>• Use water bottle markings as guides</li>
                <li>• 8 glasses = roughly 2 litres (standard goal)</li>
                <li>• Track consistently rather than perfectly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downscale Clinic Info */}
      <Card className="bg-gradient-to-br from-[#b68a71]/20 to-[#8b6f47]/10 border-[#b68a71]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#b68a71]">
            <Star className="h-5 w-5" />
            Downscale Weight Loss Clinic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">
            Comprehensive weight loss support with GLP-1 medications, nutrition counseling, 
            and ongoing medical supervision. Get the professional support you deserve.
          </p>
          
          {/* Patient Discount Highlight */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">Exclusive Patient Discount</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Current Downscale patients receive <strong className="text-yellow-400">15% off</strong> all 
              Water4WeightLoss premium features and subscriptions.
            </p>
            <Badge variant="outline" className="border-yellow-500 text-yellow-400">
              Use code: DOWNSCALE15
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-200">Services Include:</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• GLP-1 medication management</li>
                <li>• Personalized nutrition plans</li>
                <li>• Regular medical check-ins</li>
                <li>• Body composition analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-200">Why Choose Downscale:</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Doctor-supervised programs</li>
                <li>• Evidence-based treatments</li>
                <li>• Ongoing support & monitoring</li>
                <li>• Convenient telehealth options</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={() => handleExternalLink('https://downscale.com.au')}
              className="bg-[#b68a71] hover:bg-[#8b6f47] text-white flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Downscale Clinic
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExternalLink('https://downscale.com.au/contact')}
              className="border-[#b68a71] text-[#b68a71] hover:bg-[#b68a71]/10 flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Book Consultation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Lightbulb className="h-5 w-5" />
            Daily Hydration Strategies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-400">Morning Routine</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Start with 500ml upon waking</li>
                <li>• Add lemon for extra metabolism boost</li>
                <li>• Drink before your morning coffee</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-400">Throughout the Day</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Set hourly reminders on your phone</li>
                <li>• Keep a water bottle at your desk</li>
                <li>• Drink before each meal</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              💡 <strong>Pro Tip:</strong> If you're not used to drinking water, start with your current 
              intake + 500ml per day and gradually increase. Your body will adapt!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Features */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Target className="h-5 w-5" />
            Making the Most of Water4WeightLoss
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-200">Key Features:</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Quick-add buttons for easy logging</li>
                <li>• Smart AI motivation coaching</li>
                <li>• Body metrics tracking integration</li>
                <li>• Beautiful progress exports</li>
                <li>• Voice logging capability</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-200">Best Practices:</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Log water immediately after drinking</li>
                <li>• Set realistic daily goals</li>
                <li>• Track body metrics weekly</li>
                <li>• Export progress monthly for motivation</li>
                <li>• Use other drinks feature sparingly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 