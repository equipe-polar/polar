import { BarChart3, BookOpen, ClipboardList, GraduationCap, Home, Settings, Shield, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import logoPolar from "../../assets/logo-polar.svg";
import { canAccess } from "../../app/permissions";
import { useAuth } from "../../app/providers";
import "./layout.css";

const navItems = [
  { label: "Inicio", to: "/", icon: Home, permission: "dashboard:view" as const },
  { label: "Ocorrencias", to: "/ocorrencias", icon: ClipboardList, permission: "ocorrencias:view" as const },
  { label: "Alunos", to: "/alunos", icon: GraduationCap, permission: "alunos:view" as const },
  { label: "Turmas", to: "/turmas", icon: BookOpen, permission: "turmas:view" as const },
  { label: "Usuarios", to: "/usuarios", icon: Users, permission: "usuarios:manage" as const },
  { label: "Relatorios", to: "/relatorios", icon: BarChart3, permission: "relatorios:view" as const },
  { label: "Configuracoes", to: "/configuracoes", icon: Settings, permission: "configuracoes:manage" as const }
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`.trim()} aria-label="Navegacao principal">
      <div className="sidebar__brand">
        <img src={logoPolar} alt="" />
        <div className="sidebar__brand-text">
          <strong>P.O.L.A</strong>
          <span>Gestao escolar</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems
          .filter((item) => canAccess(user?.papel, item.permission))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} title={collapsed ? item.label : undefined}>
                <Icon size={20} aria-hidden="true" />
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="sidebar__footer">
        <Shield size={18} aria-hidden="true" />
        <span className="sidebar__label">Ambiente institucional</span>
      </div>
    </aside>
  );
}
