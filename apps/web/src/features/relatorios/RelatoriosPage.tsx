import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import type { RelatorioOcorrencias } from "../../services/domain";
import { getRelatorioOcorrencias } from "../../services/school.service";

export function RelatoriosPage() {
  const [relatorio, setRelatorio] = useState<RelatorioOcorrencias | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getRelatorioOcorrencias();
        if (!active) return;
        setRelatorio(data);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar relatorios.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const total = relatorio?.total ?? 0;
  const resolvidas = relatorio?.byStatus.RESOLVIDA ?? 0;
  const encerradas = relatorio?.byStatus.ENCERRADA ?? 0;
  const categorias = Object.keys(relatorio?.byCategory ?? {}).length;

  return (
    <>
      <PageHeader
        title="Relatorios"
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Relatorios" }]}
        actions={<Button variant="secondary" icon={<Download size={18} />}>Exportacao futura</Button>}
      />
      <div className="page-grid">
        <Card title="Filtros">
          <div className="form-grid">
            <Select
              label="Periodo"
              options={[
                { label: "Mes atual", value: "mes" },
                { label: "Bimestre", value: "bimestre" },
                { label: "Ano letivo", value: "ano" }
              ]}
            />
            <Select
              label="Status"
              options={[
                { label: "Todos", value: "" },
                { label: "REGISTRADA", value: "REGISTRADA" },
                { label: "EM_ANALISE", value: "EM_ANALISE" },
                { label: "RESOLVIDA", value: "RESOLVIDA" },
                { label: "ENCERRADA", value: "ENCERRADA" }
              ]}
            />
          </div>
        </Card>
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <div className="grid-4">
          <Card title="Ocorrencias">
            <span className="summary-value">{loading ? "..." : total}</span>
          </Card>
          <Card title="Resolvidas">
            <span className="summary-value">{loading ? "..." : resolvidas}</span>
          </Card>
          <Card title="Encerradas">
            <span className="summary-value">{loading ? "..." : encerradas}</span>
          </Card>
          <Card title="Categorias">
            <span className="summary-value">{loading ? "..." : categorias}</span>
          </Card>
        </div>
      </div>
    </>
  );
}
