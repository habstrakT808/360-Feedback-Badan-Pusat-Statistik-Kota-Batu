"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null);

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug User Info</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(userInfo, null, 2)}
      </pre>
    </div>
  );
}
