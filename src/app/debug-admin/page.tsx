"use client";

import { useState, useEffect } from "react";
import { AdminService } from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function DebugAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const adminStatus = await AdminService.isCurrentUserAdmin();
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  };

  const testAdminAccess = async () => {
    setLoading(true);
    try {
      const adminStatus = await AdminService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      toast.success(`Admin status: ${adminStatus}`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Test updating user profile
      const result = await AdminService.updateUser(user.id, {
        full_name: "Test Update " + new Date().toLocaleTimeString()
      });
      toast.success("Update successful: " + result.full_name);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug Admin Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user?.id || "Not logged in"}</p>
          <p><strong>Email:</strong> {user?.email || "N/A"}</p>
          <p><strong>Admin Status:</strong> {isAdmin === null ? "Checking..." : isAdmin ? "✅ Admin" : "❌ Not Admin"}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Admin Tests</h2>
        <div className="space-y-4">
          <button
            onClick={testAdminAccess}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Admin Access"}
          </button>
          
          <button
            onClick={testUpdateUser}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-2"
          >
            {loading ? "Testing..." : "Test Update User"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
        <div className="space-y-2">
          <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not Set"}</p>
          <p><strong>Service Role Key:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Not Set"}</p>
        </div>
      </div>
    </div>
  );
}
