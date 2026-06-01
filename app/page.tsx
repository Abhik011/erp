"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/brand";

export default function Home() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-10 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt={PRODUCT_NAME} width={36} height={36} />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold text-gray-900">{PRODUCT_NAME}</h1>
            <p className="text-xs text-gray-500">{COMPANY_NAME}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {!user ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm px-4 py-2 rounded-md hover:bg-blue-600 hover:text-white font-medium text-gray-600 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Open ERP
              </Link>
              <UserButton  />
            </>
          )}
        </div>
      </header>

      <section className="max-w-5xl mx-auto text-center py-28 px-6">
        <p className="text-sm font-medium text-blue-700 uppercase tracking-widest mb-3">
          Enterprise resource planning
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          {PRODUCT_NAME}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Run sales, billing, projects, and operations in one {PRODUCT_NAME} workspace—aligned
          with how your team actually works.
        </p>
        <Link
          href={user ? "/dashboard" : "/sign-in"}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          {user ? "Go to dashboard" : "Get started"}
        </Link>
      </section>

      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6 pb-24">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Sales & pipeline</h3>
          <p className="text-sm text-blue-700">
            Leads, customers, and deals in a single operational view.
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Finance</h3>
          <p className="text-sm text-blue-700">
            Quotes and invoices with clear payment status and reporting.
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Delivery</h3>
          <p className="text-sm text-blue-700">
            Projects and tasks so delivery stays tied to commercial data.
          </p>
        </div>
      </section>

      <footer className="text-center py-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} {COMPANY_NAME} · {PRODUCT_NAME}
        </p>
      </footer>
    </div>
  );
}
