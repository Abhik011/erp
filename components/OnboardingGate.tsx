"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCompany } from "@/components/CompanyProvider";

const SKIP_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/logout",
  "/onboarding",
];

function shouldSkipOnboardingRedirect(pathname: string) {
  if (pathname === "/" || pathname === "/pricing") return true;
  return SKIP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * - Workspace owners (super_admin): organization setup until workspace onboarding is done.
 * - Invited members: short welcome until user onboarding is done.
 */
export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { workspaceReady, workspaceUser } = useCompany();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!workspaceReady || !workspaceUser) return;
    if (shouldSkipOnboardingRedirect(pathname)) return;

    const role = workspaceUser.role;

    if (
      role === "super_admin" &&
      workspaceUser.workspaceOnboardingCompleted === false
    ) {
      router.replace("/onboarding/workspace");
      return;
    }

    if (role !== "super_admin" && workspaceUser.onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [
    isLoaded,
    isSignedIn,
    workspaceReady,
    workspaceUser,
    pathname,
    router,
  ]);

  return null;
}
