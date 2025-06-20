# Water4WeightLoss Color Guidelines

This document outlines the color system for the Water4WeightLoss application, ensuring consistency, accessibility, and clinical appropriateness across all UI components.

## Color System Overview

Our color system is built with accessibility in mind, following WCAG 2.1 AA contrast guidelines. All colors have been tested for sufficient contrast ratios to ensure readability for users with visual impairments.

## Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary 50 | `#e0f7fa` | Light backgrounds, subtle accents |
| Primary 100 | `#b2ebf2` | Hover states, secondary actions |
| Primary 200 | `#80deea` | Active states, tertiary actions |
| Primary 300 | `#4dd0e1` | Interactive elements |
| Primary 400 | `#00bcd4` | Hover states for primary actions |
| Primary 500 | `#0097a7` | Primary brand color, main actions |
| Primary 600 | `#00838f` | Active primary buttons |
| Primary 700 | `#006064` | Pressed states, accents |
| Primary 800 | `#004d40` | Text on light backgrounds |
| Primary 900 | `#00251a` | Headings, important text |

## Text Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Text | `#000000` | Main body text, headings |
| Secondary Text | `#1a237e` | Secondary information, labels |
| Disabled Text | `#5c6bc0` | Disabled states, placeholder text |
| Inverse Text | `#ffffff` | Text on dark backgrounds |

## Feedback Colors

### Success
- **500**: `#43a047` - Success states, confirmations
- **600**: `#388e3c` - Hover states for success elements
- **700**: `#2e7d32` - Active success elements

### Warning
- **500**: `#ffa000` - Warning states, caution messages
- **600**: `#ff8f00` - Hover states for warnings
- **700**: `#ff6f00` - Critical warnings

### Error
- **500**: `#f44336` - Error states, destructive actions
- **600**: `#e53935` - Hover states for errors
- **700**: `#d32f2f` - Critical errors

## Background Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Light | `#ffffff` | Default background |
| Dark | `#0f172a` | Dark mode background |

## Accessibility Guidelines

### Contrast Ratios
All text colors meet or exceed WCAG 2.1 AA requirements:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+bold): 3:1 contrast ratio

### Color Usage
1. **Primary Actions**: Use `primary-500` for primary buttons and main CTAs
2. **Secondary Actions**: Use `primary-300` for secondary buttons
3. **Text**: Use `text-primary` for body text, `text-secondary` for labels
4. **Feedback**: 
   - Success: `success-500` for confirmation messages
   - Warning: `warning-500` for cautionary messages
   - Error: `error-500` for error states

### Do's and Don'ts
- ✅ Do use the provided color tokens
- ✅ Do test new color combinations for accessibility
- ✅ Do maintain sufficient contrast ratios
- ❌ Don't use colors outside the defined palette
- ❌ Don't use color as the only visual cue
- ❌ Don't use red/green combinations (colorblind considerations)

## Implementation

### Using Colors in Components
```tsx
import { colors } from '@/theme/colors';

// Use in styled-components
const Button = styled.button`
  background-color: ${colors.primary[500]};
  color: ${colors.text.inverse};
  
  &:hover {
    background-color: ${colors.primary[600]};
  }
`;

// Or with CSS variables
:root {
  --primary-500: #0097a7;
  --text-inverse: #ffffff;
}
```

### Testing Contrast
We use automated tests to ensure color contrast meets WCAG 2.1 AA standards. Run the tests with:

```bash
npm test -- src/theme/accessibility.test.ts
```

## Color Blindness Considerations
- Avoid using color as the only means of conveying information
- Use patterns, icons, or text labels in addition to color
- Test designs with color blindness simulators

## Dark Mode (Future)
Planned implementation will include a dark mode color scheme that maintains accessibility standards.

---

*Last Updated: June 20, 2025*
