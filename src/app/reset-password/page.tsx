"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Suspense } from "react";

function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sessionSet, setSessionSet] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams?.get("access_token") || searchParams?.get("token") || "";
  const refreshToken = searchParams?.get("refresh_token") || "";
  const supabase = createClient();

  useEffect(() => {
    if (accessToken && !sessionSet) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setMessage("Failed to set session: " + error.message);
        } else {
          setSessionSet(true);
        }
      });
    }
  }, [accessToken, refreshToken, sessionSet, supabase.auth]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setMessage("Invalid or missing token.");
      return;
    }
    if (!sessionSet) {
      setMessage("Session not established. Please try again in a moment.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated! You can now log in.");
      setTimeout(() => router.push("/admin/login"), 2000);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Reset Password
        </button>
      </form>
      {message && <div className="mt-4 text-red-600">{message}</div>}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
