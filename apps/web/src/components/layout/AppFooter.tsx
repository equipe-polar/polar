import logoPolar from "../../assets/logo-polar.svg";
import "./layout.css";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__brand">
        <img src={logoPolar} alt="" />
        <strong>P.O.L.A</strong>
      </div>

      <div className="app-footer__column">
        <strong>Sistema</strong>
        <span>Ocorrencias institucionais</span>
        <span>Ambiente da rede publica</span>
      </div>

      <div className="app-footer__column">
        <strong>Suporte</strong>
        <span>Procure a coordenacao da unidade</span>
        <span>Registros sao auditados</span>
      </div>

      <div className="app-footer__column">
        <strong>Privacidade</strong>
        <span>Dados de estudantes protegidos pela LGPD</span>
      </div>
    </footer>
  );
}
