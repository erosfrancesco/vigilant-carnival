import { WebSocketStatus } from "./components/WebSocketStatus";
import { GpioSettings } from "./gpio/GpioSettings";
import { I2CSettings } from "./i2c/I2CSettings";
import { DashboardSettings } from "./components/DashboardSettings";
import { WebSocketProvider } from "./context/WebSocketProvider";
import { GpioProvider } from "./context/GpioProvider";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import type { Page } from "./components/Sidebar";
import { useState } from "react";

const defaultUrl = import.meta.env.VITE_WEBSOCKET_URL ?? "ws://localhost:8080";
function App() {
  const [activePage, setActivePage] = useState<Page>("monitor");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <WebSocketProvider initialUrl={defaultUrl}>
      <GpioProvider>
        <AppContent
          activePage={activePage}
          onNavigate={setActivePage}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((open) => !open)}
        />
      </GpioProvider>
    </WebSocketProvider>
  );
}

function AppContent({
  activePage,
  onNavigate,
  sidebarOpen,
  onSidebarToggle,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <header className={sidebarOpen ? "w-16 shrink-0 sm:w-64" : "w-16 shrink-0"}>
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          open={sidebarOpen}
          onToggle={onSidebarToggle}
        />
      </header>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {activePage === "settings" ? (
            <>
              <WebSocketStatus />
              <DashboardSettings />
              <GpioSettings />
              <I2CSettings />
            </>
          ) : (
            <Dashboard />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
