import type { Metadata } from "next";
import "./globals.css";

import { DM_Sans, DM_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: {
    default: "Creonox CRM",
    template: "%s | Creonox CRM",
  },
  description:
    "Creonox CRM is a company relationship and operations management platform to manage clients, leads, invoices, deals, and internal operations.",
  keywords: [
    "CRM",
    "Creonox CRM",
    "Customer Relationship Management",
    "Business Management Software",
    "Company Operations Platform",
  ],
  authors: [{ name: "Creonox" }],
  creator: "Creonox",
  metadataBase: new URL("https://crm.creonox.com"),

  openGraph: {
    title: "Creonox CRM",
    description:
      "Manage leads, customers, invoices, and company operations with Creonox CRM.",
    url: "https://crm.creonox.com",
    siteName: "Creonox CRM",
    type: "website",
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
    <html lang="en">
      <body className={`${dmSans.className} ${dmMono.variable} bg-[#f9f9f7]`}>
        {children}
      </body>
    </html>
  );
}