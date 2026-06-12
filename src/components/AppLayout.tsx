import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container flex-1 py-6 pb-28 md:pb-10 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
}
