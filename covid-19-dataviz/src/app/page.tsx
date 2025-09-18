import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Home() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
            <h1 className="text-lg font-semibold">COVID-19 Data Visualization</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="p-8">
              <div className="flex flex-col gap-[32px] items-center sm:items-start">
                <Image
                  className="dark:invert"
                  src="/next.svg"
                  alt="Next.js logo"
                  width={180}
                  height={38}
                  priority
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold mb-4">Welcome to COVID-19 Data Visualization</h2>
                  <p className="text-muted-foreground mb-6">
                    Explore comprehensive COVID-19 data through interactive charts and visualizations.
                    Use the sidebar to navigate between different sections of the dashboard.
                  </p>
                </div>

                <div className="flex gap-4 items-center flex-col sm:flex-row">
                  <a
                    className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                    href="/global"
                  >
                    View Global Data
                  </a>
                  <a
                    className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                    href="/charts"
                  >
                    Explore Charts
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
