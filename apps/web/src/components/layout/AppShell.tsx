import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "./layout.css";

export function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`app-shell ${open ? "is-open" : ""}`}>
      <Sidebar />
      <div className="app-shell__content">
        <Topbar onMenu={() => setOpen((value) => !value)} />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
