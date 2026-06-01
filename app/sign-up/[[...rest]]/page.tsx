import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-16">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />

      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
        <p className="font-semibold text-amber-950">Were you invited by your admin?</p>
        <p className="mt-2 leading-relaxed text-amber-900/90">
          Use <strong>Sign in</strong> with the email address from your invite—not a new sign-up—
          so you join your company&apos;s existing {PRODUCT_NAME} workspace. Creating a new
          account here can create an extra Clerk profile and organization.
        </p>
        <Link
          href="/sign-in"
          className="mt-3 inline-block text-sm font-medium text-amber-950 underline underline-offset-2"
        >
          Go to sign in
        </Link>
      </div>

      <div className="w-full max-w-md text-sm text-gray-600 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="font-medium text-gray-900">Employee or invited user?</p>
        <p className="leading-relaxed">
          If your admin added you by email, you can{" "}
          <strong>create a password here</strong> with the same address, or open{" "}
          <Link href="/sign-in" className="text-gray-900 underline font-medium">
            sign-in
          </Link>{" "}
          if you already have a Clerk account. After your first successful login you
          will complete a short onboarding step in {PRODUCT_NAME}.
        </p>
      </div>
    </div>
  );
}
