'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Droplets, Clock, Zap, Shield, HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InfoCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const INFO_CARDS: InfoCard[] = [
  {
    id: 'hydration-counts',
    title: 'What Counts as Hydration?',
    icon: <Droplets className="h-5 w-5 text-hydration-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Not all drinks hydrate equally! Here's what counts toward your daily goal:
        </p>
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <span className="text-xl">💧</span>
            <div>
              <div className="font-semibold text-green-400">Water & Sparkling Water</div>
              <div className="text-sm text-slate-400">100% hydration value</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <span className="text-xl">🍼</span>
            <div>
              <div className="font-semibold text-green-400">Protein Water</div>
              <div className="text-sm text-slate-400">100% hydration value</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <span className="text-xl">🍵</span>
            <div>
              <div className="font-semibold text-green-400">Herbal Tea</div>
              <div className="text-sm text-slate-400">100% hydration value</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <span className="text-xl">🍲</span>
            <div>
              <div className="font-semibold text-yellow-400">Soup & Broth</div>
              <div className="text-sm text-slate-400">90% hydration value</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <span className="text-xl">🍉</span>
            <div>
              <div className="font-semibold text-orange-400">Fruit Water (Watermelon, Cucumber)</div>
              <div className="text-sm text-slate-400">80% hydration value</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Use the "Other Drink" button to log these alternatives and see their exact hydration contribution!
        </p>
      </div>
    )
  },
  {
    id: 'hydration-hacks',
    title: 'Hydration Hacks for Busy Lives',
    icon: <Clock className="h-5 w-5 text-purple-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Staying hydrated when life gets busy:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">👩‍⚕️</span>
            <div>
              <div className="font-semibold text-purple-400">For Healthcare Workers & Shift Workers</div>
              <div className="text-sm text-slate-400">Keep a water bottle at your station. Set phone reminders every 2 hours. Pre-hydrate before long shifts.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👩‍🏫</span>
            <div>
              <div className="font-semibold text-purple-400">For Teachers & Desk Workers</div>
              <div className="text-sm text-slate-400">Fill up during breaks. Use a large bottle to minimize refills. Drink before you feel thirsty.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🏋️</span>
            <div>
              <div className="font-semibold text-purple-400">For Gym & Training</div>
              <div className="text-sm text-slate-400">Pre-hydrate 2 hours before. Sip during workouts. Weigh yourself before/after to track fluid loss.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">✈️</span>
            <div>
              <div className="font-semibold text-purple-400">For Travel & Commuting</div>
              <div className="text-sm text-slate-400">Carry a reusable bottle. Avoid excess caffeine and alcohol. Drink extra on planes.</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'weight-energy',
    title: 'How Hydration Affects Weight & Energy',
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Proper hydration is your secret weapon for weight management and sustained energy:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <div className="font-semibold text-yellow-400 mb-2">⚡ Energy & Focus</div>
            <div className="text-sm text-slate-300">Even mild dehydration (2%) can reduce concentration, mood, and cognitive performance. Stay sharp by staying hydrated!</div>
          </div>
          <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
            <div className="font-semibold text-blue-400 mb-2">🔥 Fat Loss Support</div>
            <div className="text-sm text-slate-300">Hydration supports metabolism, helps control hunger signals, and optimizes fat-burning processes during exercise.</div>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
            <div className="font-semibold text-green-400 mb-2">🍽️ Appetite Control</div>
            <div className="text-sm text-slate-300">Sometimes thirst masquerades as hunger. Drink water 30 minutes before meals to support healthy portion control.</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'plastics-safety',
    title: 'Plastics & Endocrine Disruptors',
    icon: <Shield className="h-5 w-5 text-green-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Protect your health by choosing safer hydration containers:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="font-semibold text-green-400 mb-2">✅ Best Choices</div>
            <div className="text-sm text-slate-300">Glass, stainless steel, or BPA-free bottles. These won't leach chemicals into your water, especially when heated.</div>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="font-semibold text-orange-400 mb-2">⚠️ Avoid When Possible</div>
            <div className="text-sm text-slate-300">Plastic bottles left in heat (cars, sun), single-use bottles reused multiple times, or bottles with recycling codes 3, 6, or 7.</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="font-semibold text-blue-400 mb-2">💡 Quick Tip</div>
            <div className="text-sm text-slate-300">If using plastic, keep it cool and replace regularly. Your hormonal health will thank you!</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Common Issues',
    icon: <HelpCircle className="h-5 w-5 text-orange-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Common hydration challenges and simple solutions:
        </p>
        <div className="space-y-3">
          <div className="border-l-4 border-orange-400 pl-4">
            <div className="font-semibold text-orange-400">"I hate the taste of water"</div>
            <div className="text-sm text-slate-300 mt-1">Add lemon, cucumber, or mint. Try sparkling water. Use a water bottle with a built-in filter for better taste.</div>
          </div>
          <div className="border-l-4 border-blue-400 pl-4">
            <div className="font-semibold text-blue-400">"I forget to drink water"</div>
            <div className="text-sm text-slate-300 mt-1">Set phone reminders every 2 hours. Use a large bottle to track progress visually. Link drinking to existing habits (before meals, after bathroom breaks).</div>
          </div>
          <div className="border-l-4 border-purple-400 pl-4">
            <div className="font-semibold text-purple-400">"Water makes me feel sick/bloated"</div>
            <div className="text-sm text-slate-300 mt-1">Sip slowly instead of chugging. Try room temperature water. Space intake throughout the day rather than large amounts at once.</div>
          </div>
          <div className="border-l-4 border-green-400 pl-4">
            <div className="font-semibold text-green-400">"I'm always running to the bathroom"</div>
            <div className="text-sm text-slate-300 mt-1">Your body will adjust! Start gradually and increase intake slowly. Avoid drinking large amounts right before bed.</div>
          </div>
        </div>
      </div>
    )
  }
];

export default function InfoCards() {
  const handleSuggestTopic = () => {
    // Simple mailto for now - could be enhanced with a modal/form later
    window.open('mailto:support@water4weightloss.com?subject=Info Tab Topic Suggestion&body=I would like to suggest a new topic for the Info tab:', '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Hydration Insights</h2>
        <p className="text-slate-400">Everything you need to know about healthy hydration</p>
      </div>

      {/* Info Cards Accordion */}
      <Card className="bg-slate-800 border-[#b68a71] shadow-lg">
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {INFO_CARDS.map((card) => (
              <AccordionItem key={card.id} value={card.id} className="border-slate-700">
                <AccordionTrigger className="px-6 py-4 hover:bg-slate-700/30 transition-colors duration-200 text-left">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <span className="text-lg text-slate-200">{card.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {card.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Suggest Topic Button */}
      <Card className="bg-slate-800 border-[#b68a71] shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <MessageSquare className="h-8 w-8 text-slate-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Have a suggestion?</h3>
              <p className="text-sm text-slate-400 mb-4">
                We're always looking to improve our hydration guidance. What topics would you like to see covered?
              </p>
              <Button
                onClick={handleSuggestTopic}
                variant="outline"
                className="border-[#b68a71] text-[#b68a71] hover:bg-[#b68a71]/10"
              >
                Suggest a Topic
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-500">
          💡 This information is for educational purposes and doesn't replace medical advice
        </p>
      </div>
    </div>
  );
} 