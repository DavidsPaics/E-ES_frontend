import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";

function LayoutContent() {
  const { sidebarWidth } = useSidebar();

  return (
    <div className="min-h-screen bg-[#0A306D] text-[#FCFDFD]">
      <Sidebar />
      <main
        className="min-h-screen transition-all duration-300 ease-in-out pt-16 sm:pt-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  );
}

const WebappLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default WebappLayout;
