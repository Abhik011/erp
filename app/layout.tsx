import type { Metadata } from "next";
import "./globals.css";

import { DM_Sans, DM_Mono, Geist } from "next/font/google";
import { CompanyProvider } from "@/components/CompanyProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Nexora",
    template: "%s | Nexora",
  },
  description:
    "Nexora is a modern SaaS platform to manage leads, clients, invoices, deals, and complete business operations in one place.",
  keywords: [
    "Nexora",
    "ERP SaaS",
    "Business Management Software",
    "CRM ERP Platform",
    "Operations Management System",
  ],
  authors: [{ name: "Creonox" }], // keep company credit
  creator: "Creonox",
  metadataBase: new URL("https://crm.creonox.com"), // ✅ unchanged

  openGraph: {
    title: "Nexora",
    description:
      "Run your entire business with Nexora — manage leads, customers, invoices, and operations seamlessly.",
    url: "https://crm.creonox.com", // ✅ unchanged
    siteName: "Nexora",
    type: "website",
  },

  icons: {
    icon: "/logo.svg", // you can replace later with Nexora logo
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${dmSans.className} ${dmMono.variable} bg-[#f9f9f7]`}>
        <CompanyProvider>{children}</CompanyProvider>
      </body>
    </html>
  );
}