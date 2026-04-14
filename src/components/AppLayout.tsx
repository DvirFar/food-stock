import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const MobileTrigger = () => {
  const { isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <div className="sticky top-0 z-30 flex items-center h-10 bg-background border-b px-2 md:hidden">
      <SidebarTrigger />
    </div>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <MobileTrigger />
          <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
