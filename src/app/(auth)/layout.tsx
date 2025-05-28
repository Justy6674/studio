
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#334155' }}
    >
      <main className="flex-1">
        {children}
      </main>
      <footer 
        className="py-4 text-center text-xs border-t"
        style={{ 
          color: '#9CA3AF',
          borderColor: '#4A5568'
        }}
      >
        Water4WeightLoss - HydrateAI &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
