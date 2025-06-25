"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthStateDebugger() {
  const { user, userProfile, loading } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="mb-6 border-yellow-400 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🐛 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-yellow-900">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Authentication Status:</strong>
            <ul className="mt-1 space-y-1">
              <li>Loading: {loading ? '✅ Yes' : '❌ No'}</li>
              <li>User Exists: {user ? '✅ Yes' : '❌ No'}</li>
              <li>User Email: {user?.email || '❌ None'}</li>
              <li>User UID: {user?.uid || '❌ None'}</li>
              <li>Display Name: {user?.displayName || '❌ None'}</li>
            </ul>
          </div>
          
          <div>
            <strong>Profile Data:</strong>
            <ul className="mt-1 space-y-1">
              <li>Profile Loaded: {userProfile ? '✅ Yes' : '❌ No'}</li>
              <li>Profile Name: {userProfile?.name || '❌ None'}</li>
              <li>Profile Email: {userProfile?.email || '❌ None'}</li>
              <li>Hydration Goal: {userProfile?.hydrationGoal || '❌ None'}</li>
              <li>Created: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '❌ None'}</li>
            </ul>
          </div>
        </div>
        
        {!user && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
            <strong className="text-red-800">🚨 NO USER AUTHENTICATED</strong>
            <p className="text-red-700 mt-1">You need to log in first. Go to <a href="/login" className="underline">/login</a></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 