import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppFooter } from "./AppFooter";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "./layout.css";

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-shell ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`.trim()}>
      <Sidebar collapsed={collapsed} />
      <div className="app-shell__content">
        <Topbar
          onMenu={() => setOpen((value) => !value)}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          sidebarCollapsed={collapsed}
        />
        <main className="app-shell__main">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
