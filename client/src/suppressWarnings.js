// Suppress harmless Three.js deprecation warnings and Supabase warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args[0]?.toString?.() || '';
  
  // Filter out these specific deprecation warnings
  if (message.includes('THREE.Clock') && message.includes('deprecated')) return;
  if (message.includes('PCFSoftShadowMap') && message.includes('deprecated')) return;
  
  // Filter out Supabase credentials warning in development
  if (message.includes('Supabase') && message.includes('credentials')) return;
  if (message.includes('VITE_SUPABASE')) return;
  
  originalWarn.apply(console, args);
};
