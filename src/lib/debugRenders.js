// Render cycle diagnosis helper
const componentRenderCounts = {};
const renderTimestamps = {};
const renderIntervals = {};
let lastComponentName = '';

/**
 * Log when a component renders and track render frequency
 * @param {string} componentName - Name of the component 
 */
export function logRender(componentName) {
  // Record render count
  componentRenderCounts[componentName] = (componentRenderCounts[componentName] || 0) + 1;
  
  // Record render timestamp
  const now = Date.now();
  const last = renderTimestamps[componentName];
  renderTimestamps[componentName] = now;
  
  // Calculate and track render interval
  if (last) {
    const interval = now - last;
    if (!renderIntervals[componentName]) {
      renderIntervals[componentName] = [];
    }
    
    // Keep last 5 intervals
    if (renderIntervals[componentName].length >= 5) {
      renderIntervals[componentName].shift();
    }
    renderIntervals[componentName].push(interval);
    
    // Calculate average interval
    const avg = renderIntervals[componentName].reduce((a, b) => a + b, 0) / renderIntervals[componentName].length;
    
    // Check if this component is rendering rapidly (potential loop)
    if (avg < 100 && renderIntervals[componentName].length >= 3) {
      console.warn(`⚠️ RAPID RENDERING: ${componentName} is rendering every ${Math.round(avg)}ms - potential render loop!`);
    }
    
    // Check for alternating component renders (potential parent-child loop)
    if (lastComponentName !== componentName && lastComponentName && avg < 200) {
      console.warn(`⚠️ ALTERNATING RENDER PATTERN: ${lastComponentName} → ${componentName} → ${lastComponentName}`);
    }
  }
  
  lastComponentName = componentName;
  
  // Log to console
  console.log(`🔍 ${componentName} rendered (${componentRenderCounts[componentName]} times)`);
}

export function getDiagnostics() {
  return {
    componentRenderCounts,
    renderIntervals,
  };
}
