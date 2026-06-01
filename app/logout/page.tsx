"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { performAppSignOut } from "@/lib/signOut";

/**
 * Dedicated sign-out route (public in middleware).
 * Clears workspace + local app storage, then ends the Clerk session.
 */
export default function LogoutPage() {
  const { signOut, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    void performAppSignOut(signOut);
  }, [isLoaded, signOut]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6 text-sm text-gray-600">
      Signing out…
    </div>
  );
}
