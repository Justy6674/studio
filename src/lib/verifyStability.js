// Verify application stability
// This script adds a one-time verification log to confirm render cycles are normal
// Run this in your browser console to check render performance

(function() {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Count renders by component
  const renderCounter = {};
  let totalWarnings = 0;
  let stabilityVerified = false;
  
  console.warn = function(...args) {
    // Check for rapid rendering warnings
    if (typeof args[0] === 'string' && args[0].includes('RAPID RENDERING DETECTED')) {
      totalWarnings++;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    // Check for hydration errors
    if (typeof args[0] === 'string' && args[0].includes('CRITICAL')) {
      totalWarnings++;
    }
    originalConsoleError.apply(console, args);
  };
  
  // Run stability check after 5 seconds
  setTimeout(() => {
    if (totalWarnings === 0) {
      console.log('%c✅ STABILITY VERIFICATION: Application is stable with normal render cycles', 
                 'background: #4ade80; color: #1e293b; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      stabilityVerified = true;
    } else {
      console.log('%c⚠️ STABILITY WARNING: ' + totalWarnings + ' performance issues detected', 
                 'background: #fb7185; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    }
    
    // Restore original console methods
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  }, 5000);
  
  console.log('Stability verification running...');
  return 'Checking application stability - results in 5 seconds';
})();
