import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { contarPendencias, descricaoPendencias, statusPendentes } from "../../features/ocorrencias/pendencias";
import { getDashboardResumo } from "../../services/school.service";
import "./layout.css";

/**
 * Sino de pendencias: quantas ocorrencias aguardam uma acao deste usuario.
 *
 * O numero vem do resumo do dashboard, que ja respeita o escopo por papel no
 * backend -- nao existe estado de notificacao persistido. Papeis que nao movem
 * status (professor, ADM, aluno) nao veem o sino, porque para eles o contador
 * seria sempre zero e um sino permanentemente vazio so ocupa espaco.
 */
export function PendenciasBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const temPendencias = statusPendentes(user?.papel).length > 0;

  useEffect(() => {
    if (!temPendencias) return;
    let ativo = true;

    async function carregar() {
      try {
        const resumo = await getDashboardResumo();
        if (ativo) setTotal(contarPendencias(user?.papel, resumo));
      } catch {
        // O sino e informativo: se a consulta falhar, a pagina continua util.
        if (ativo) setTotal(0);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [temPendencias, user?.papel]);

  if (!temPendencias) return null;

  const descricao = descricaoPendencias(user?.papel, total);

  return (
    <button
      type="button"
      className="pendencias-bell"
      onClick={() => navigate("/ocorrencias")}
      title={descricao}
      aria-label={descricao}
    >
      <Bell size={22} aria-hidden="true" />
      {total > 0 ? <span className="pendencias-bell__badge">{total > 9 ? "9+" : total}</span> : null}
    </button>
  );
}
