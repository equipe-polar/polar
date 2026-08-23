import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import type { RelatorioOcorrencias, Turma } from "../../services/domain";
import { getRelatorioOcorrencias, listTurmas } from "../../services/school.service";

interface DadoGrafico {
  nome: string;
  total: number;
}

function GraficoBarras({ dados }: { dados: DadoGrafico[] }) {
  const maiorValor = Math.max(...dados.map((item) => item.total), 1);
  const largura = Math.max(dados.length * 72, 280);

  return (
    <svg className="report-chart" viewBox={`0 0 ${largura} 220`} role="img" aria-label="Gráfico de barras da distribuição de ocorrências por turma">
      {dados.map((item, index) => {
        const altura = (item.total / maiorValor) * 150;
        const x = 24 + index * 72;
        return (
          <g key={item.nome}>
            <rect x={x} y={178 - altura} width="44" height={altura} rx="4" className="report-chart__bar" />
            <text x={x + 22} y="172" textAnchor="middle" className="report-chart__value">{item.total}</text>
            <text x={x + 22} y="204" textAnchor="middle" className="report-chart__label">{item.nome}</text>
          </g>
        );
      })}
    </svg>
  );
}

function GraficoLinha({ dados }: { dados: DadoGrafico[] }) {
  const maiorValor = Math.max(...dados.map((item) => item.total), 1);
  const largura = Math.max(dados.length * 92, 300);
  const pontos = dados.map((item, index) => {
    const x = 34 + index * ((largura - 68) / Math.max(dados.length - 1, 1));
    const y = 174 - (item.total / maiorValor) * 132;
    return { ...item, x, y };
  });

  return (
    <svg className="report-chart" viewBox={`0 0 ${largura} 220`} role="img" aria-label="Gráfico de linha da evolução mensal de ocorrências">
      <line x1="28" x2={largura - 20} y1="174" y2="174" className="report-chart__axis" />
      <polyline fill="none" points={pontos.map((item) => `${item.x},${item.y}`).join(" ")} className="report-chart__line" />
      {pontos.map((item) => (
        <g key={item.nome}>
          <circle cx={item.x} cy={item.y} r="5" className="report-chart__point" />
          <text x={item.x} y={item.y - 10} textAnchor="middle" className="report-chart__value">{item.total}</text>
          <text x={item.x} y="204" textAnchor="middle" className="report-chart__label">{item.nome}</text>
        </g>
      ))}
    </svg>
  );
}

export function RelatoriosPage() {
  const [relatorio, setRelatorio] = useState<RelatorioOcorrencias | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTurmas() {
      try {
        const data = await listTurmas();
        if (active) setTurmas(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Nao foi possivel carregar as turmas.");
      }
    }
    void loadTurmas();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    async function loadRelatorio() {
      try {
        const data = await getRelatorioOcorrencias({
          turmaId: turmaId || undefined,
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined
        });
        if (!active) return;
        setRelatorio(data);
        setError("");
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Nao foi possivel carregar relatorios.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRelatorio();
    return () => { active = false; };
  }, [turmaId, dataInicio, dataFim]);

  const total = relatorio?.total ?? 0;
  const resolvidas = relatorio?.byStatus.RESOLVIDA ?? 0;
  const encerradas = relatorio?.byStatus.ENCERRADA ?? 0;
  const categorias = Object.keys(relatorio?.byCategory ?? {}).length;
  const dadosTurma = relatorio?.byTurma ?? [];
  const dadosPeriodo = (relatorio?.byPeriodo ?? []).map((item) => ({
    nome: item.periodo.slice(5, 7) + "/" + item.periodo.slice(0, 4),
    total: item.total
  }));

  return (
    <>
      <PageHeader
        title="Relatorios"
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Relatorios" }]}
        actions={<Button variant="secondary" icon={<Download size={18} />} disabled>Exportacao futura</Button>}
      />
      <div className="page-grid">
        <Card title="Filtros">
          <div className="form-grid">
            <Select
              label="Turma"
              value={turmaId}
              onChange={(event) => setTurmaId(event.target.value)}
              options={[{ value: "", label: "Todas as turmas" }, ...turmas.map((turma) => ({ value: turma.id, label: turma.nome }))]}
            />
            <Input label="Data inicial" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
            <Input label="Data final" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
          </div>
        </Card>
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <div className="grid-4">
          <Card className="stat-card stat-card--blue"><span className="stat-card__value">{loading ? "..." : total}</span><span className="stat-card__label">Total</span></Card>
          <Card className="stat-card stat-card--orange"><span className="stat-card__value">{loading ? "..." : resolvidas}</span><span className="stat-card__label">Resolvidas</span></Card>
          <Card className="stat-card stat-card--green"><span className="stat-card__value">{loading ? "..." : encerradas}</span><span className="stat-card__label">Encerradas</span></Card>
          <Card className="stat-card"><span className="stat-card__value">{loading ? "..." : categorias}</span><span className="stat-card__label">Categorias</span></Card>
        </div>
        <div className="grid-2">
          <Card title="Distribuicao por turma">
            {dadosTurma.length > 0 ? <GraficoBarras dados={dadosTurma} /> : <p className="muted">Sem ocorrencias para os filtros selecionados.</p>}
            <Table data={dadosTurma} columns={[{ key: "nome", header: "Turma", render: (item) => item.nome }, { key: "total", header: "Ocorrencias", render: (item) => item.total }]} empty="Sem dados por turma." />
          </Card>
          <Card title="Evolucao por periodo">
            {dadosPeriodo.length > 0 ? <GraficoLinha dados={dadosPeriodo} /> : <p className="muted">Sem ocorrencias para os filtros selecionados.</p>}
            <Table data={dadosPeriodo} columns={[{ key: "nome", header: "Periodo", render: (item) => item.nome }, { key: "total", header: "Ocorrencias", render: (item) => item.total }]} empty="Sem dados por periodo." />
          </Card>
        </div>
      </div>
    </>
  );
}
