import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#08080f" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}