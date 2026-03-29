import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen ">

      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <main className="ml-64 p-8 ">
        {children}
      </main>

    </div>
  );
}