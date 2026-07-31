import { ClipboardPlus, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers";
import { canAccess } from "../../app/permissions";
import { iniciaisDe, rotuloDePapel } from "../../components/layout/iniciais";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { getDashboardResumo, listOcorrenciasDetalhadas } from "../../services/school.service";
import type { DashboardResumo, OcorrenciaDetalhada } from "../../services/domain";
import { contarPendencias, descricaoPendencias, statusPendentes } from "../ocorrencias/pendencias";
import { DiasEmAberto } from "../ocorrencias/DiasEmAberto";
import { PrioridadeBadge, StatusBadge } from "../ocorrencias/status";

const emptyResumo: DashboardResumo = {
  totalOcorrencias: 0,
  ocorrenciasPorStatus: {},
  ocorrenciasPorPrioridade: {},
  ocorrenciasPorCategoria: {}
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumo, setResumo] = useState<DashboardResumo>(emptyResumo);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextResumo, nextOcorrencias] = await Promise.all([getDashboardResumo(), listOcorrenciasDetalhadas()]);
        if (!active) return;
        setResumo(nextResumo);
        setOcorrencias(nextOcorrencias.slice(0, 5));
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar o dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const total = resumo.totalOcorrencias;
  const emAnalise = resumo.ocorrenciasPorStatus.EM_ANALISE ?? 0;
  const alta = resumo.ocorrenciasPorPrioridade.ALTA ?? 0;
  const encerradas = resumo.ocorrenciasPorStatus.ENCERRADA ?? 0;

  const temPendencias = statusPendentes(user?.papel).length > 0;
  const pendencias = contarPendencias(user?.papel, resumo);

  return (
    <>
      <div className="greeting">
        <span className="avatar avatar--lg" aria-hidden="true">
          {iniciaisDe(user?.nome)}
        </span>
        <div className="greeting__text">
          <h1>
            Ola, <strong>{user?.nome?.split(" ")[0] ?? "bem-vindo"}</strong>
          </h1>
          <p className="greeting__meta">
            {rotuloDePapel(user?.papel)} · Dashboard de ocorrencias institucionais
          </p>
        </div>
        {canAccess(user?.papel, "ocorrencias:create") ? (
          <div className="greeting__actions">
            <Link to="/ocorrencias/nova">
              <Button icon={<ClipboardPlus size={18} />}>Nova ocorrencia</Button>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="page-grid">
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}

        <div className="grid-4">
          {temPendencias ? (
            <Card
              className={`stat-card ${pendencias > 0 ? "stat-card--red" : "stat-card--green"} pendencias-card`}
              role="button"
              tabIndex={0}
              onClick={() => navigate("/ocorrencias")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/ocorrencias");
                }
              }}
            >
              <span className="stat-card__value">{loading ? "..." : pendencias}</span>
              <span className="stat-card__label">Pendencias</span>
              <span className="pendencias-card__hint">{descricaoPendencias(user?.papel, pendencias)}</span>
            </Card>
          ) : (
            <Card className="stat-card stat-card--blue">
              <span className="stat-card__value">{loading ? "..." : total}</span>
              <span className="stat-card__label">Total</span>
            </Card>
          )}

          <Card className="stat-card stat-card--orange">
            <span className="stat-card__value">{loading ? "..." : emAnalise}</span>
            <span className="stat-card__label">Em analise</span>
          </Card>

          <Card className="stat-card stat-card--red">
            <span className="stat-card__value">{loading ? "..." : alta}</span>
            <span className="stat-card__label">Alta prioridade</span>
          </Card>

          <Card className="stat-card stat-card--green">
            <span className="stat-card__value">{loading ? "..." : encerradas}</span>
            <span className="stat-card__label">Encerradas</span>
          </Card>
        </div>

        <div className="grid-2-wide">
          <Card title="Ultimas ocorrencias">
            {loading ? (
              <p className="muted">Carregando ocorrencias...</p>
            ) : ocorrencias.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhuma ocorrencia registrada.</strong>
                <span>Quando houver registros no seu escopo, eles aparecem aqui.</span>
              </div>
            ) : (
              <Table
                data={ocorrencias}
                columns={[
                  { key: "aluno", header: "Aluno", render: (item) => item.aluno },
                  { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  {
                    key: "prioridade",
                    header: "Prioridade",
                    render: (item) => <PrioridadeBadge prioridade={item.prioridade} />
                  },
                  {
                    key: "aberta",
                    header: "Em aberto",
                    render: (item) => <DiasEmAberto desde={item.criadoEm} status={item.status} />
                  }
                ]}
              />
            )}
          </Card>

          <Card title="Acoes rapidas">
            <div className="actions-row">
              <Link to="/ocorrencias">
                <Button variant="secondary" icon={<FileText size={18} />}>
                  Ocorrencias
                </Button>
              </Link>
              {canAccess(user?.papel, "relatorios:view") ? (
                <Link to="/relatorios">
                  <Button variant="secondary" icon={<FileText size={18} />}>
                    Relatorios
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
