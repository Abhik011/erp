import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, DM_Mono, Geist } from "next/font/google";
import { CompanyProvider } from "@/components/CompanyProvider";
import { OnboardingGate } from "@/components/OnboardingGate";
import { cn } from "@/lib/utils";
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: PRODUCT_TAGLINE,
  keywords: [
    PRODUCT_NAME,
    COMPANY_NAME,
    "ERP",
    "Enterprise",
    "CRM",
    "Invoices",
    "Team messaging",
  ],
  authors: [{ name: COMPANY_NAME }],
  creator: COMPANY_NAME,
  metadataBase: new URL("https://crm.creonox.com"),

  openGraph: {
    title: PRODUCT_NAME,
    description: PRODUCT_TAGLINE,
    url: "https://crm.creonox.com",
    siteName: PRODUCT_NAME,
    type: "website",
  },

  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

// ✅ MAIN FONT
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
});

// ✅ MONO FONT
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        elements: {
          organizationSwitcherPopoverActionButton__createOrganization: {
            display: "none",
          },
          organizationListCreateOrganizationActionButton: { display: "none" },
          organizationSwitcherTrigger: { display: "none" },
        },
      }}
    >
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body
          className={`${dmSans.className} ${dmMono.variable} h-screen overflow-hidden bg-[#f9f9f7]`}
        >
          <CompanyProvider>
            <OnboardingGate />
            {children}
          </CompanyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}