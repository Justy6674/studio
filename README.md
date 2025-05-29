
# 💧 Water4WeightLoss — Weight Loss Hydration Companion

**Purpose:**
This project is a modern, clinic-grade hydration tracking app for Australians wanting to lose weight, built and designed by a real prescriber who runs a weight loss clinic in Australia.
The **entire premise** is that water intake is a core lever for sustainable fat loss, with daily logging, clinical-style reminders, motivational nudges, and a vibe that is friendly, smart, and grounded in reality—not cringe, not “fitspo,” not random AI garbage.

**Primary Audience:**

* Adults, mostly 25–60, who want medical-grade weight loss support
* Anyone seeing a real practitioner, using GLP-1s or lifestyle tools
* Absolutely Australian (spelling, units, time, pricing)

---

## 🏗️ Overall Approach (for AI or Human Devs)

* **NO Americanisation** (ml, not oz; AU date formats; all currency AUD)
* **Never reference “HydrateAI” or “Hydrate” in brand—this is Water4WeightLoss**
* **No “Fitspo”** or toxic motivational garbage. Everything must be friendly, professional, and reflect how an actual Aussie prescriber speaks.
* **No “diet”/restriction language or body shaming**
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
* **SMS Reminders** (Twilio; customisable tone: “supportive,” “funny,” “crass,” “strict,” “weightloss”)
* **User Settings** (hydration goal, reminder tone, enable/disable AI, enable/disable SMS)
* **Analytics Dashboard** (weekly intake, day-by-day, chart with average, recent activity)
* **Subscription Paywall** (Stripe: \$4.99 AUD/month—NO US dollars, no fake “free” features; only account, AI, and reminders are gated)
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
* method: string (“glass”, “bottle”, “sip”, etc)
* moodTag: string (“thirsty”, “motivated”, “routine”)

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
* type: string (“log\_add”, “reminder\_sent”, etc)
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
* **Monetization and AI features must be enabled by default—no placeholder switches**

---

## 🧑‍💻 AI/Developer Instructions — How Not to Fuck It Up

> **“Cursor: Stay on this README. Don’t add new features unless described here.
> Always check for Replit, Supabase, or old junk and delete.
> If unsure about a feature, ask for clarification before coding.
> Never use ‘HydrateAI’—the app is called ‘Water4WeightLoss’ only.
> All motivational/AI content must be realistic, never toxic, and always Australian.”**

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

## 💬 Support & Contact

This is a clinic-grade project, not a side hustle.
All feedback and pull requests must be specific, tested, and non-breaking.
If you need context, read this README top-to-bottom before you do anything else.

---

*Water4WeightLoss — Australian clinical hydration app, not a tech experiment.*
