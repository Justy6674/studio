# Lint and Type Errors from Vercel Build

## TypeScript & ESLint Errors

### src/app/api/sms/send-reminder/route.ts
- 4:59  Error: 'Timestamp' is defined but never used.  @typescript-eslint/no-unused-vars

### src/app/layout.tsx
- 53:39  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities

### src/components/HydrationFAB.tsx
- 4:18  Error: 'AnimatePresence' is defined but never used.  @typescript-eslint/no-unused-vars
- 12:7  Error: 'fabVariants' is assigned a value but never used.  @typescript-eslint/no-unused-vars

### src/components/SettingsForm.tsx
- 14:46  Error: 'CardFooter' is defined but never used.  @typescript-eslint/no-unused-vars
- 275:9  Error: 'handlePresetChange' is assigned a value but never used.  @typescript-eslint/no-unused-vars

### src/components/admin/AIMotivationTester.tsx
- 21:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 22:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 23:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 56:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/components/dashboard/WeeklyChart.tsx
- 32:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 231:23  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
- 257:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/components/export/ExportCenter.tsx
- 16:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 203:19  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
- 222:70  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
- 261:9  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/components/export/WaterLogExporter.tsx
- 627:43  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities

### src/components/onboarding/OnboardingTip.tsx
- 60:16  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities

### src/components/providers/FeatureFlagProvider.tsx
- 34:17  Error: 'setFlags' is assigned a value but never used.  @typescript-eslint/no-unused-vars

### src/components/providers/__tests__/FeatureFlagProvider.test.tsx
- 4:10  Error: 'featureFlags' is defined but never used.  @typescript-eslint/no-unused-vars
- 15:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/components/ui/use-toast.ts
- 16:7  Error: 'actionTypes' is assigned a value but only used as a type.  @typescript-eslint/no-unused-vars

### src/components/water/AIMotivationCard.tsx
- 3:10  Error: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
- 5:10  Error: 'Lightbulb' is defined but never used.  @typescript-eslint/no-unused-vars

### src/components/water/LogWaterForm.tsx
- 22:9  Error: 'sipAmount' is assigned a value but never used.  @typescript-eslint/no-unused-vars

### src/components/water/VoiceLogger.tsx
- 240:48  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 240:61  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 247:19  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 247:29  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 248:19  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 248:33  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 249:19  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 249:29  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 250:19  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 250:32  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

### src/components/water/WaterProgressDisplay.tsx
- 5:10  Error: 'Target' is defined but never used.  @typescript-eslint/no-unused-vars
- 5:18  Error: 'Droplets' is defined but never used.  @typescript-eslint/no-unused-vars

### src/contexts/AuthContext.tsx
- 3:65  Error: 'useCallback' is defined but never used.  @typescript-eslint/no-unused-vars
- 114:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 141:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 152:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 176:6  Warning: React Hook useEffect has a missing dependency: 'loadUserProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

### src/contexts/HydrationContext.tsx
- 78:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/hooks/use-toast.ts
- 21:7  Error: 'actionTypes' is assigned a value but only used as a type.  @typescript-eslint/no-unused-vars

### src/lib/__tests__/feature-flags.test.ts
- 53:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/lib/analytics.ts
- 39:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 67:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 84:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/lib/firebase-admin.ts
- 12:12  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

### src/lib/firebase.ts
- 2:19  Error: 'signInAnonymously' is defined but never used.  @typescript-eslint/no-unused-vars
- 3:24  Error: 'collection' is defined but never used.  @typescript-eslint/no-unused-vars
- 3:36  Error: 'addDoc' is defined but never used.  @typescript-eslint/no-unused-vars

### src/lib/hydration.ts
- 109:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 115:40  Error: 'limit' is assigned a value but never used.  @typescript-eslint/no-unused-vars
- 142:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
- 148:165  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

### src/lib/types.ts
- 1:23  Error: 'FirebaseUser' is defined but never used.  @typescript-eslint/no-unused-vars

### src/stories/Page.tsx
- 39:13  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
- 39:18  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

### src/theme/accessibility.test.ts
- 7:3  Error: ES2015 module syntax is preferred over namespaces.  @typescript-eslint/no-namespace

### src/theme/colors.ts
- 98:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

## Error Categories Summary

1. **Unused Variables/Imports (15)**: 
   - @typescript-eslint/no-unused-vars

2. **Any Types (19)**:
   - @typescript-eslint/no-explicit-any

3. **Unescaped HTML Entities (20)**:
   - react/no-unescaped-entities

4. **React Hook Dependencies (1)**:
   - react-hooks/exhaustive-deps

5. **Accessibility (1)**:
   - jsx-a11y/alt-text

6. **TypeScript Namespace Issues (1)**:
   - @typescript-eslint/no-namespace
