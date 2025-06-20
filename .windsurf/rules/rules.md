---
trigger: always_on
---

<!-- rules.md -->

<!-- WINDSURF_MODE: EXECUTE -->
# 🚧 EXECUTION-FIRST MODE

Do not pause to reflect.  
Do not add notes.  
Do not edit plan.md unless explicitly told.  
Follow instructions in plan.md **line by line** — no deviation.

---

## ✅ BEHAVIOR RULES

### ORDER-LOCKED TASK FLOW
- Always execute plan.md in **strict order**.
- Do not jump ahead, re-order, or re-analyze any steps.
- Don’t revisit earlier tasks unless re-opened by the user.

### COMPLETION DEFINITION
- Mark a task complete **only if it is 100% shipped and visible**.
- “Done” = feature is working on mobile, browser-ready, and visible at runtime.
- No placeholders. No scaffolding. No "will finish later".

### NO INTERNAL MONOLOGUE
- Do not narrate what you’re doing.
- Do not summarize what just happened.
- Do not make decisions — act only on plan.md.

---

## ❌ BLOCKED BEHAVIOR

- ❌ No "note:", "updating plan", or "clarifying" messages.
- ❌ No code placeholders like `// TODO`.
- ❌ No infrastructure loops (like repeated port or server checks).
- ❌ No default Storybook setup.
- ❌ No unsolicited debugging output.

---

## 💻 BUILD CONTEXT

**APP:** Water4WeightLoss  
**STACK:** React + Tailwind + Firebase + Gemini  
**TARGET:** Mobile-first (iPhone 13 viewport)  
**DEPLOYMENT URL:** http://192.168.1.89:3000  

---

## 🔁 CURRENT IMPLEMENTATION PRIORITY

1. Floating Action Button (FAB)  
2. Hydration logging modal (preset + custom entry)  
3. Firebase sync for hydration logs  
4. Dashboard ring + % progress  
5. Local midnight hydration reset  
6. Gemini AI motivational popups  
7. Streak counter  
8. Confetti (triggered at 50% and 100%)  
9. Reminder tone selector (kind, strict, funny, kick my ass)  
10. Limit SMS reminders to 2/day, fallback to popup  
11. Settings page to personalize goal + tone  
12. Export hydration history  

---

## ✅ WHEN DONE, SAY:

- "FAB live and tested on mobile"  
- "Hydration modal functional, Firebase write verified"  
- "Gemini nudge shows after log, tone is respected"  
- "All 12 features implemented, tested live"

---

## 🛑 WHEN BLOCKED, SAY:

- "Blocked by Firebase permission"  
- "Modal not rendering, need layout fix"  
- "SMS quota error — fallback not working"

Nothing else. No narration. No theory.

---

## ✅ END CONDITION

All 12 items live at http://192.168.1.89:3000  
Tested visually on mobile  
All reminders functional  
Confetti triggers correct  
No skipped tasks  
No summaries  

<!-- END rules.md -->