import { ChevronLeft, Menu } from "lucide-react";
import { PendenciasBell } from "./PendenciasBell";
import { UserMenu } from "./UserMenu";
import "./layout.css";

export function Topbar({
  onMenu,
  onToggleSidebar,
  sidebarCollapsed
}: {
  onMenu?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}) {
  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <button
        type="button"
        className={`topbar__collapse ${sidebarCollapsed ? "is-collapsed" : ""}`.trim()}
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? "Expandir navegacao" : "Recolher navegacao"}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <div className="topbar__spacer" />

      <PendenciasBell />
      <UserMenu />
    </header>
  );
}
