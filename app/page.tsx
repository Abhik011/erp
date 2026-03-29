import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="flex items-center justify-between px-10 py-6 border-b">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Creonox CRM" width={36} height={36} />
          <h1 className="text-lg font-semibold text-gray-900">
            Creonox CRM
          </h1>
        </div>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-md hover:bg-blue-600 hover:text-white font-medium text-gray-600 hover:text-black"
          >
            Login
          </Link>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center py-32 px-6">

        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Creonox CRM
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Company Relationship & Operations Management platform to manage
          clients, leads, invoices, deals and internal operations in one place.
        </p>

        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Open Dashboard
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6 pb-24">

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">
            Lead Management
          </h3>
          <p className="text-sm text-blue-700">
            Track leads and convert prospects into customers.
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">
            Invoice System
          </h3>
          <p className="text-sm text-blue-700">
            Generate invoices and track payment status.
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">
            Email Integration
          </h3>
          <p className="text-sm text-blue-700">
            Send invoices and updates directly from the CRM.
          </p>
        </div>

      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Creonox
        </p>
      </footer>

    </div>
  );
}