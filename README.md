# �� Water4WeightLoss — By Downscale App

A comprehensive hydration tracking application built for Australians, focusing on using proper hydration to support fat metabolism and healthy, AI-supported weight loss.

## 🎯 Core Features

- **User Authentication**: Firebase Auth for secure access
- **Hydration Logging**: Timestamped water intake tracking with visual glass display
- **AI-Powered Motivation**: Daily motivational messages generated by Gemini AI
- **SMS Reminders**: Scheduled Twilio SMS with customisable tone preferences
- **Streak Tracking**: Daily and longest streak monitoring
- **Progress Visualisation**: Interactive water glass and progress charts
- **Dashboard Analytics**: Weekly intake charts and recent activity logs

## 🎨 Design System

- **Primary Colour**: `#5271ff` (vibrant blue-purple for interactive elements)
- **Background**: `#1e293b` (dark slate gray - 20% desaturated)
- **Accent Colour**: `#b68a71` (warm brown for borders and highlights)
- **Typography**: Accessible cream tones with consistent iconography
- **Animations**: Subtle water effects (ripple, shimmer) for engaging feedback

## 💰 Monetisation

- **Subscription**: $6.99 AUD/month via Stripe
- **Gated Features**: Account management, AI coaching, and Twilio SMS behind authentication

## 📊 Monitoring and Error Tracking

### Performance Monitoring

We use Lighthouse CI to track performance metrics and ensure our app meets performance standards. The following metrics are monitored:

- **First Contentful Paint (FCP)**: Measures loading performance
- **Largest Contentful Paint (LCP)**: Measures loading performance
- **Cumulative Layout Shift (CLS)**: Measures visual stability
- **First Input Delay (FID)**: Measures interactivity
- **Time to First Byte (TTFB)**: Measures server response time

To run Lighthouse CI locally:

```bash
npm run lhci:autorun
```

### Web Vitals

Web Vitals are automatically tracked and reported to our analytics service. The following metrics are collected:

- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

### Error Tracking with Sentry

We use Sentry for error tracking and monitoring. The following types of errors are tracked:

- Unhandled exceptions
- Unhandled promise rejections
- React component errors (via ErrorBoundary)
- Network request failures

To test error tracking in development:

```typescript
// Example: Manually report an error
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(new Error('Test error'));
```

### Analytics

We track user interactions and page views using Firebase Analytics. The following events are tracked:

- Page views
- Feature usage
- User interactions
- Conversion events

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Feature Flags (Unleash)
NEXT_PUBLIC_UNLEASH_URL=https://app.unleash-hosted.com/demo/api/
NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your-client-key
NEXT_PUBLIC_UNLEASH_APP_NAME=water4weightloss-production

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Twilio (if not already configured)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

## 🛠 Tech Stack

- **Frontend**: Next.js 15 on Replit
- **Backend**: Firebase (Auth, Firestore, Functions, Analytics)
- **AI Integration**: Gemini AI for motivational content and insights
- **SMS Service**: Twilio with user tone preferences
- **Styling**: Tailwind CSS with custom theme
- **Charts**: Recharts for data visualisation

## 🏗️ Overall Approach (for AI or Human Devs)

* **NO Americanisation** (ml, not oz; AU date formats; all currency AUD)
* **Never reference "By Downscale" or "Hydrate" in brand—this is Water4WeightLoss**
* **No "Fitspo"** or toxic motivational garbage. Everything must be friendly, professional, and reflect how an actual Aussie prescriber speaks.
* **No "diet"/restriction language or body shaming**
* **Simple, clear, visually fun UI, but not childish**
* **Everything must be usable by a non-tech, non-coder patient or clinician**
* **NO Supabase, NO Replit, NO leftover test scripts or placeholder code—remove all**
* **All backend logic is Firebase Functions, Firestore, and Node.js**
* **Frontend is Next.js (Vercel or Cursor), Tailwind, and plain TypeScript**
* **Only use Gemini for all AI logic**
* **Twilio for SMS reminders—never any other service**
* **Mobile-first, accessible, responsive**

---

## 🎯 Core Features — Do NOT Deviate

* **Secure Authentication** (Firebase Auth—email/password, Google, Apple, but NO anonymous)
* **Hydration Logging** (each log: amount, time, method, moodTag, all timestamped)
* **Progress Visuals** (interactive glasses, progress bars, and streaks—show today, this week, best streak)
* **Gemini AI Motivational Messages** (user gets an AI nudge based on streaks, tone preference, and current water log; must NOT be repetitive or generic)
* **SMS Reminders** (Twilio; customisable tone: "supportive," "funny," "crass," "strict," "weightloss")
* **User Settings** (hydration goal, reminder tone, enable/disable AI, enable/disable SMS)
* **Analytics Dashboard** (weekly intake, day-by-day, chart with average, recent activity)
* **Subscription Paywall** (Stripe: $6.99 AUD/month—NO US dollars, no fake "free" features; only account, AI, and reminders are gated)
* **Admin-Only: Webhook for Stripe events** (cancel, renew, change)

---

## 👀 UI / Design Rules

* **Primary Colour:** #5271ff (blue-violet, interactive elements)
* **Background:** #1e293b (dark slate, not black)
* **Accent:** #b68a71 (warm brown, for highlights, never overused)
* **Typography:** Accessible, cream-coloured font (#f7f2d3)
* **No rounded photo bubbles or childish icons**
* **Every button must be bold and high-contrast**
* **Charts:** Recharts, never Chart.js or D3

---

## 🔥 Firestore Data Model (Do NOT Stuff This Up)

### hydration\_logs/{userId}/{timestamp}

* amount: number
* method: string ("glass", "bottle", "sip", etc)
* moodTag: string ("thirsty", "motivated", "routine")

### user\_preferences/{userId}

* aiTone: string
* hydrationGoal: number (ml)
* smsReminderOn: boolean
* aiMessagesOn: boolean

### users/{userId}

* email: string
* tier: string (free/premium)
* createdAt: timestamp
* lastLogin: timestamp
* name: string

### analytics\_events/{eventId}

* userId: string
* type: string ("log\_add", "reminder\_sent", etc)
* timestamp: timestamp
* metadata: object

---

## 🛠️ Cloud Functions (All Required)

**Each function must be present, written in `/functions/index.js`, and TESTED:**

1. `logWaterEntry`
2. `getHydrationLogs`
3. `getDailyHydrationSummary`
4. `generateMotivationalMessage` (Gemini-powered)
5. `sendSMSReminder` (Twilio)
6. `updateUserSettings`
7. `getUserSettings`
8. `handleBillingWebhook` (Stripe)
9. `generateHydrationGoalInsight` (Gemini-powered)

* All must use HTTPS Callable, except for billing webhook (plain HTTP).
* All must check authentication and user permissions.
* **No dummy/test functions! Delete anything unused or from Supabase/Replit.**

---

## 🚦 Project Build Rules

* Use **Cursor** for code, UI, and logic—NO more Replit, Vercel for frontend deploy
* **README must stay up to date and describe any new endpoint or function**
* Every commit must be tested, and major features require a short note in README
* **Never leave TODOs, unfinished, or unused files**
* No generated or test users/data in production
* **Always Australian spelling and units**
* **Monetisation and AI features must be enabled by default—no placeholder switches**

---

## 🧑‍💻 AI/Developer Instructions — How Not to Fuck It Up

> **"Cursor: Stay on this README. Don't add new features unless described here.
> Always check for Replit, Supabase, or old junk and delete.
> If unsure about a feature, ask for clarification before coding.
> Never use 'By Downscale'—the app is called 'Water4WeightLoss' only.
> All motivational/AI content must be realistic, never toxic, and always Australian."**

---

## 🚀 Getting Started

### 1. Install everything

```bash
npm install
cd functions
npm install
cd ..
```

### 2. Add environment variables

Create `.env.local` in project root and paste your real API keys (see above).

### 3. Connect Firebase

```bash
firebase login
firebase use --add
# Pick hydrateai-ayjow, alias as water4weightloss
```

### 4. (If needed) Seed Firestore

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./hydrateai-ayjow-firebase-adminsdk-fbsvc-22288d853a.json"
node seedFirestore.mjs
```

### 5. Deploy backend

```bash
firebase deploy --only functions
```

### 6. Deploy frontend (Vercel or Cursor deploy)

* Import repo, set all env vars, hit deploy

---

### Security & Authentication
- **Always** verify user authentication before function execution
- Use Firebase Auth context for all user-specific operations

### Localisation
- Use Australian spelling and metric units (ml, not oz)
- All currency in AUD

### Code Standards
- Follow existing component patterns in `/src/components/`
- Maintain TypeScript strict typing
- Use the established colour palette and design system

### Deployment
- Hosted on Replit with automatic scaling
- Firebase Functions handle all backend logic
- Environment variables managed via Replit Secrets

## 💬 Support & Contact

This is a clinic-grade project, not a side hustle.
All feedback and pull requests must be specific, tested, and non-breaking.
If you need context, read this README top-to-bottom before you do anything else.

---

*Water4WeightLoss — Australian clinical hydration app, not a tech experiment.*
