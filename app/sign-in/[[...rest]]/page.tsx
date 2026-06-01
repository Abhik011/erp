import { SignIn } from "@clerk/nextjs";
import { PRODUCT_NAME } from "@/lib/brand";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-16">
      <SignIn
        path="/sign-in"
        routing="path"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />

      <div className="w-full max-w-md text-sm text-gray-600 space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="font-medium text-gray-900">Trouble verifying by email?</p>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            Clerk&apos;s email link only works on the{" "}
            <strong>same device and browser</strong> where you started sign-in. If
            you began on a laptop, do not open the link only on your phone.
          </li>
          <li>
            <strong>Outlook</strong> and some corporate inboxes prefetch links for
            security, which can mark them expired before you click. Use{" "}
            <strong>Resend</strong> and open the new link immediately, or use{" "}
            <strong>Use another method</strong> and sign in with{" "}
            <strong>password</strong> if you were invited (check your {PRODUCT_NAME} invite
            email for a temporary password).
          </li>
          <li>
            In the Clerk dashboard, ensure <strong>Password</strong> is enabled
            under User authentication so invited users can sign in with email +
            password, not only magic links.
          </li>
        </ul>
      </div>
    </div>
  );
}
