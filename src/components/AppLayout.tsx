import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
