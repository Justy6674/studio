"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appColors, checkAppColorContrast, suggestAccessibleColors } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, AlertTriangle } from "lucide-react";

export const AccessibilityAudit = () => {
  const [showAudit, setShowAudit] = useState(false);
  const [fixColors, setFixColors] = useState(false);
  
  const colorIssues = checkAppColorContrast();
  const improvedColors = suggestAccessibleColors();
  const hasIssues = colorIssues.some(issue => !issue.passes);
  
  // Apply improved colors if fixColors is true (uses CSS variables)
  const applyCSSVariables = () => {
    if (fixColors && hasIssues) {
      const root = document.documentElement;
      
      // Apply fixed colors to CSS variables
      Object.entries(improvedColors).forEach(([key, value]) => {
        // Convert camelCase to kebab-case for CSS variables
        const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--${cssVarName}`, value);
      });
    } else {
      // Reset to theme defaults
      const root = document.documentElement;
      Object.keys(appColors).forEach(key => {
        const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.removeProperty(`--${cssVarName}`);
      });
    }
  };
  
  // Apply CSS variables when fixColors changes
  useEffect(() => {
    applyCSSVariables();
  }, [fixColors]);
  
  if (!showAudit) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowAudit(true)}
        className="text-xs flex items-center gap-1"
      >
        {hasIssues ? 
          <AlertTriangle className="h-3 w-3 text-amber-500" /> : 
          <Check className="h-3 w-3 text-green-500" />
        }
        A11y Audit
      </Button>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto my-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          Accessibility Color Audit
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="fix-mode"
              checked={fixColors}
              onCheckedChange={setFixColors}
            />
            <Label htmlFor="fix-mode" className="text-sm">Apply Fixes</Label>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAudit(false)}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Color Contrast Analysis</h3>
            <Badge variant={hasIssues ? "destructive" : "outline"} className={!hasIssues ? "bg-green-50 text-green-700 border-green-200" : ""}>
              {hasIssues ? `${colorIssues.filter(i => !i.passes).length} issues found` : "All checks passed"}
            </Badge>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Element</th>
                  <th className="text-left p-2">Colors</th>
                  <th className="text-left p-2">Ratio</th>
                  <th className="text-left p-2">Required</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {colorIssues.map((issue, index) => (
                  <tr key={index} className={!issue.passes ? "bg-red-50" : "border-t"}>
                    <td className="p-2">{issue.element}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: issue.foreground }}
                        ></div>
                        {" on "}
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: issue.background }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-2">
                      {issue.ratio.toFixed(2)}:1
                    </td>
                    <td className="p-2">{issue.required}:1</td>
                    <td className="p-2 text-center">
                      {issue.passes ? (
                        <Check className="h-4 w-4 mx-auto text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mx-auto text-amber-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {hasIssues && (
            <div className="text-sm text-muted-foreground">
              <p>
                Toggle "Apply Fixes" to automatically adjust colors for better contrast.
                These changes are temporary and only applied to your current session.
              </p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Sample Elements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Standard Text</h4>
                <div className="p-4 border rounded-md">
                  <p>This is standard text on background.</p>
                  <p className="text-muted-foreground">This is muted text on background.</p>
                  <Button size="sm" className="mt-2">Primary Button</Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Accent & Card</h4>
                <div className="p-4 border rounded-md bg-accent">
                  <p className="text-accent-foreground">This is accent text.</p>
                  <Button variant="destructive" size="sm" className="mt-2">
                    Destructive Button
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
