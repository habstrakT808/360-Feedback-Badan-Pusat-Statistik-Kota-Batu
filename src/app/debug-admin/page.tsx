"use client";

import { useState, useEffect } from "react";
import { AdminService } from "@/lib/admin-service";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function DebugAdminPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user && 'id' in session.user) {
      checkAdminStatus();
    }
  }, [session]);

  const checkAdminStatus = async () => {
    try {
      if (session?.user && 'id' in session.user) {
        const adminStatus = await AdminService.isCurrentUserAdmin(session.user.id as string);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const testAdminAccess = async () => {
    setLoading(true);
    try {
      if (session?.user && 'id' in session.user) {
        const adminStatus = await AdminService.isCurrentUserAdmin(session.user.id as string);
        setIsAdmin(adminStatus);
        toast.success(`Admin status: ${adminStatus}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateUser = async () => {
    if (!session?.user || !('id' in session.user)) return;
    
    setLoading(true);
    try {
      // Test updating user profile
      const result = await AdminService.updateUser(session.user.id as string, {
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
          <p><strong>User ID:</strong> {session?.user && 'id' in session.user ? (session.user.id as string) : "Not logged in"}</p>
          <p><strong>Email:</strong> {session?.user?.email || "N/A"}</p>
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
            disabled={loading || !session?.user || !('id' in session.user)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-2"
          >
            {loading ? "Testing..." : "Test Update User"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
        <div className="space-y-2">
          <p><strong>Database URL:</strong> {process.env.DATABASE_URL ? "✅ Set" : "❌ Not Set"}</p>
          <p><strong>NextAuth Secret:</strong> {process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Not Set"}</p>
          <p><strong>NextAuth URL:</strong> {process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Not Set"}</p>
        </div>
      </div>
    </div>
  );
}
