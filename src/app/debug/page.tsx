"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Current session:", session);
      setUserInfo({
        user: session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
    };

    checkUser();
  }, []);

  const cleanupDuplicates = async () => {
    try {
      setIsCleaning(true);
      setCleanupResult("Cleaning up duplicates...");
      
      const response = await fetch('/api/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCleanupResult(`✅ ${result.message}`);
      } else {
        setCleanupResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setCleanupResult(`❌ Failed to cleanup: ${error}`);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug & Maintenance</h1>
      
      {/* User Info Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">User Info</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(userInfo, null, 2)}
        </pre>
      </div>

      {/* Maintenance Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Maintenance Tools</h2>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-2">Cleanup Duplicate Notifications</h3>
            <p className="text-sm text-gray-600 mb-3">
              Remove duplicate notifications that may have been created due to system issues.
            </p>
            <button
              onClick={cleanupDuplicates}
              disabled={isCleaning}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isCleaning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isCleaning ? 'Cleaning...' : 'Cleanup Duplicates'}
            </button>
            {cleanupResult && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                {cleanupResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
