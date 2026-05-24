import { ClipboardPlus, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { getDashboardResumo, listOcorrenciasDetalhadas } from "../../services/school.service";
import type { DashboardResumo, OcorrenciaDetalhada } from "../../services/domain";
import { PrioridadeBadge, StatusBadge } from "../ocorrencias/status";

const emptyResumo: DashboardResumo = {
  totalOcorrencias: 0,
  ocorrenciasPorStatus: {},
  ocorrenciasPorPrioridade: {},
  ocorrenciasPorCategoria: {}
};

export function DashboardPage() {
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

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo operacional das ocorrencias institucionais."
        actions={
          <Link to="/ocorrencias/nova">
            <Button icon={<ClipboardPlus size={18} />}>Nova ocorrencia</Button>
          </Link>
        }
      />
      <div className="page-grid">
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <div className="grid-4">
          <Card title="Total">
            <span className="summary-value">{loading ? "..." : total}</span>
          </Card>
          <Card title="Em analise">
            <span className="summary-value">{loading ? "..." : emAnalise}</span>
          </Card>
          <Card title="Alta prioridade">
            <span className="summary-value">{loading ? "..." : alta}</span>
          </Card>
          <Card title="Encerradas">
            <span className="summary-value">{loading ? "..." : encerradas}</span>
          </Card>
        </div>
        <div className="grid-2">
          <Card title="Ultimas ocorrencias">
            {loading ? (
              <p className="muted">Carregando ocorrencias...</p>
            ) : (
              <Table
                data={ocorrencias}
                columns={[
                  { key: "aluno", header: "Aluno", render: (item) => item.aluno },
                  { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                  { key: "prioridade", header: "Prioridade", render: (item) => <PrioridadeBadge prioridade={item.prioridade} /> }
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
              <Link to="/relatorios">
                <Button variant="secondary" icon={<FileText size={18} />}>
                  Relatorios
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
