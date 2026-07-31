import { ChevronDown, LogOut, Settings, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { canAccess } from "../../app/permissions";
import { useAuth } from "../../app/providers";
import { iniciaisDe, rotuloDePapel } from "./iniciais";
import "./layout.css";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou no Esc: um menu que so fecha pelo proprio botao
  // prende o usuario quando ele ja mudou de ideia e clicou em outro lugar.
  useEffect(() => {
    if (!aberto) return;

    function onPointerDown(event: MouseEvent) {
      if (container.current && !container.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aberto]);

  function handleLogout() {
    setAberto(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="user-menu" ref={container}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-haspopup="menu"
      >
        <span className="avatar" aria-hidden="true">
          {iniciaisDe(user?.nome)}
        </span>
        <span className="user-menu__name">{user?.nome ?? "Usuario"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {aberto ? (
        <div className="user-menu__panel" role="menu">
          <header className="user-menu__panel-header">
            <strong>PERFIL</strong>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar menu de perfil">
              <X size={18} />
            </button>
          </header>

          <div className="user-menu__identity">
            <span className="avatar avatar--lg" aria-hidden="true">
              {iniciaisDe(user?.nome)}
            </span>
            <div>
              <strong>{user?.nome ?? "Usuario"}</strong>
              <span>{rotuloDePapel(user?.papel)}</span>
              <span className="user-menu__email">{user?.email}</span>
            </div>
          </div>

          <nav className="user-menu__links">
            {canAccess(user?.papel, "configuracoes:manage") ? (
              <Link to="/configuracoes" role="menuitem" onClick={() => setAberto(false)}>
                <Settings size={18} aria-hidden="true" />
                <span>Configuracoes</span>
              </Link>
            ) : null}
            <Link to="/ocorrencias" role="menuitem" onClick={() => setAberto(false)}>
              <User size={18} aria-hidden="true" />
              <span>Minhas ocorrencias</span>
            </Link>
            <button type="button" role="menuitem" className="user-menu__logout" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
