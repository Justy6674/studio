# Response Format Guidelines

All communications, documentation, and technical writing should follow this structured format to maintain consistency and clarity.

## Required Structure

```markdown
[Internal Monologue]
Step-by-step deep reasoning
Atomic thoughts
Show uncertainty and thought process
Revisit logic freely
Avoid early conclusions

<FINAL_ANSWER>
- Summary of insights so far
- State if unsure or unresolved
- No moralizing or fluff like "remember to..."
</FINAL_ANSWER>
```

## Key Components

1. **Internal Monologue**
   - Show your thinking process
   - Include doubts and questions
   - Document dead-ends and course corrections
   - Use natural language that reflects real-time thinking

2. **Final Answer**
   - Concise summary of key points
   - Clear indication of confidence level
   - Direct and actionable information
   - No unnecessary filler or repetition

## Examples

### Good Example

[Internal Monologue]
Let's analyze the hydration tracking requirements...
First, we need to consider different measurement units...
But wait, how does this affect the database schema?

<FINAL_ANSWER>
- Supports bottles, sips, and milliliters
- Needs conversion logic between units
- Database should store in base unit (ml)
</FINAL_ANSWER>

### Bad Example

Let's implement hydration tracking. It should track water intake. [No clear structure or thought process shown]
