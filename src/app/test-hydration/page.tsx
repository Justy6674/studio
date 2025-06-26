'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logHydration } from '@/app/actions/hydration';

export default function TestHydrationPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(250);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleLogHydration = async () => {
    if (!user) {
      setResult('❌ Not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await logHydration(user.uid, amount);
      if (response.success) {
        setResult(`✅ ${response.success}`);
      } else {
        setResult(`❌ ${response.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🧪 Hydration Test</h1>
        
        <div className="space-y-4">
          <div>
            <strong>User:</strong> {user ? `${user.email} (${user.uid})` : 'Not authenticated'}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (ml):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="1"
              max="2000"
            />
          </div>
          
          <button
            onClick={handleLogHydration}
            disabled={loading || !user}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Hydration'}
          </button>
          
          {result && (
            <div className="p-4 bg-gray-100 rounded-md">
              <strong>Result:</strong> {result}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">🔧 Debug Info</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Auth State:</strong> {user ? 'Authenticated' : 'Not authenticated'}</div>
            <div><strong>User ID:</strong> {user?.uid || 'None'}</div>
            <div><strong>Email:</strong> {user?.email || 'None'}</div>
            <div><strong>Data Structure:</strong> users/{user?.uid || 'userId'}/hydration/2025-01-25</div>
          </div>
        </div>
      </div>
    </div>
  );
} 