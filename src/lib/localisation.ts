/**
 * @fileOverview Australian English localisation utilities
 * Provides Australian spellings, date formats, and regional preferences
 */

// Australian English spelling corrections
export const australianSpellings = {
  // Color -> Colour
  'color': 'colour',
  'colors': 'colours',
  'colored': 'coloured',
  'coloring': 'colouring',
  'colorful': 'colourful',
  'discolor': 'discolour',
  'multicolor': 'multicolour',
  
  // Center -> Centre  
  'center': 'centre',
  'centers': 'centres',
  'centered': 'centred',
  'centering': 'centring',
  
  // Organization -> Organisation
  'organization': 'organisation',
  'organizations': 'organisations',
  'organize': 'organise',
  'organized': 'organised',
  'organizing': 'organising',
  
  // Realize -> Realise
  'realize': 'realise',
  'realizes': 'realises',
  'realized': 'realised',
  'realizing': 'realising',
  'realization': 'realisation',
  
  // Favorite -> Favourite
  'favorite': 'favourite',
  'favorites': 'favourites',
  
  // Analyze -> Analyse
  'analyze': 'analyse',
  'analyzes': 'analyses',
  'analyzed': 'analysed',
  'analyzing': 'analysing',
  'analysis': 'analysis', // Same in both
  
  // Optimize -> Optimise
  'optimize': 'optimise',
  'optimizes': 'optimises',
  'optimized': 'optimised',
  'optimizing': 'optimising',
  'optimization': 'optimisation',
  
  // Customize -> Customise
  'customize': 'customise',
  'customizes': 'customises',
  'customized': 'customised',
  'customizing': 'customising',
  'customization': 'customisation',
};

// Australian date and time formatting
export const australianFormats = {
  // Date format: DD/MM/YYYY
  dateFormat: 'dd/MM/yyyy',
  dateTimeFormat: 'dd/MM/yyyy HH:mm',
  shortDateFormat: 'dd/MM/yy',
  
  // Time format: 24-hour preferred
  timeFormat: 'HH:mm',
  timeFormatWithSeconds: 'HH:mm:ss',
  
  // Currency
  currency: 'AUD',
  currencySymbol: '$',
  currencyFormat: '$#,##0.00',
};

// Australian hydration terminology
export const australianHydrationTerms = {
  // Volume terms (already metric)
  'milliliters': 'millilitres',
  'milliliter': 'millilitre',
  'ml': 'ml', // Same
  'liters': 'litres',
  'liter': 'litre',
  'L': 'L', // Same
  
  // Common phrases
  'water bottle': 'water bottle',
  'drink up': 'drink up',
  'stay hydrated': 'stay hydrated',
  'hydration goal': 'hydration goal',
  'daily intake': 'daily intake',
  
  // Australian slang additions
  'drink water': 'have a drink',
  'great job': 'good on ya',
  'awesome': 'brilliant',
  'fantastic': 'ripper',
  'excellent': 'bonzer',
};

// Function to convert American spelling to Australian
export function toAustralianSpelling(text: string): string {
  let result = text;
  
  // Apply spelling corrections
  Object.entries(australianSpellings).forEach(([american, australian]) => {
    // Case-sensitive replacement
    const regex = new RegExp(`\\b${american}\\b`, 'g');
    result = result.replace(regex, australian);
    
    // Capitalize first letter if original was capitalized
    const capitalizedRegex = new RegExp(`\\b${american.charAt(0).toUpperCase() + american.slice(1)}\\b`, 'g');
    result = result.replace(capitalizedRegex, australian.charAt(0).toUpperCase() + australian.slice(1));
  });
  
  return result;
}

// Function to format date in Australian format
export function formatAustralianDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Function to format time in Australian format (24-hour)
export function formatAustralianTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Function to format currency in Australian format
export function formatAustralianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Function to get Australian hydration messages
export function getAustralianHydrationMessage(type: 'encouragement' | 'achievement' | 'reminder'): string {
  const messages = {
    encouragement: [
      "You're doing brilliantly! Keep it up, mate!",
      "Good on ya for staying hydrated!",
      "Ripper effort with your water intake!",
      "Bonzer hydration habits you've got there!",
      "Top work on hitting your goals!",
    ],
    achievement: [
      "Beauty! You've smashed your hydration goal!",
      "Too right! Another milestone achieved!",
      "Fair dinkum effort on your water intake!",
      "You little ripper! Goal achieved!",
      "Bloody brilliant hydration work!",
    ],
    reminder: [
      "Time for a drink, mate!",
      "Don't forget to have a sip!",
      "Your water bottle's looking lonely!",
      "Quick hydration break needed!",
      "Time to wet your whistle!",
    ]
  };
  
  const messageArray = messages[type];
  return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// Australian time zones
export const australianTimeZones = {
  'AWST': 'Australia/Perth',        // UTC+8
  'ACST': 'Australia/Adelaide',     // UTC+9:30
  'AEST': 'Australia/Sydney',       // UTC+10
  'ACDT': 'Australia/Adelaide',     // UTC+10:30 (DST)
  'AEDT': 'Australia/Sydney',       // UTC+11 (DST)
};

// Function to get user's Australian timezone
export function getAustralianTimeZone(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Check if it's already an Australian timezone
  if (timezone.includes('Australia/')) {
    return timezone;
  }
  
  // Default to Sydney time if not detected
  return 'Australia/Sydney';
} 