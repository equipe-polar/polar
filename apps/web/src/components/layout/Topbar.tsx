import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { Button } from "../ui/Button";
import "./layout.css";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Abrir menu">
        <Menu size={22} />
      </button>
      <div className="topbar__user">
        <strong>{user?.nome ?? "Usuario"}</strong>
        <span>{user?.papel ?? "Perfil"}</span>
      </div>
      <Button variant="ghost" icon={<LogOut size={18} />} onClick={handleLogout}>
        Sair
      </Button>
    </header>
  );
}
