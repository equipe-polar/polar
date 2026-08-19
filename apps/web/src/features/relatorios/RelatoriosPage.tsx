import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import type { RelatorioOcorrencias } from "../../services/domain";
import { getRelatorioOcorrencias } from "../../services/school.service";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"; // 1. IMPORT

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
    return () => { active = false; };
  }, []);

  const total = relatorio?.total ?? 0;
  const resolvidas = relatorio?.byStatus.RESOLVIDA ?? 0;
  const encerradas = relatorio?.byStatus.ENCERRADA ?? 0;
  const categorias = Object.keys(relatorio?.byCategory ?? {}).length;

  // 2. DADOS MOCKADOS PRA TESTAR. TROCA QUANDO O MAX LIBERAR O BACKEND
  const dadosTurma = relatorio?.byTurma ?? [
    { nome: '3A', total: 12 },
    { nome: '3B', total: 8 },
    { nome: '4C', total: 15 },
  ];
  const dadosPeriodo = relatorio?.byPeriodo ?? [
    { periodo: 'Jan', total: 5 },
    { periodo: 'Fev', total: 7 },
    { periodo: 'Mar', total: 9 },
  ];

  return (
    <>
      <PageHeader
        title="Relatorios"
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Relatorios" }]}
        actions={<Button variant="secondary" icon={<Download size={18} />}>Exportacao futura</Button>}
      />
      <div className="page-grid">
        <Card title="Filtros"> ... </Card>
        
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        
        <div className="grid-4"> ... cards de total ... </div>

        {/* 3. NOVO BLOCO: GRAFICO + TABELA LADO A LADO */}
        <div className="grid-2">
          <Card title="Distribuicao por Turma">
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTurma}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Ocorrências" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* TABELA/TEXTO COMO ALTERNATIVA */}
            <ul>
              {dadosTurma.map(t => <li key={t.nome}>{t.nome}: {t.total} ocorrências</li>)}
            </ul>
          </Card>

          <Card title="Evolucao por Periodo">
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} name="Ocorrências" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* TABELA/TEXTO COMO ALTERNATIVA */}
            <ul>
              {dadosPeriodo.map(p => <li key={p.periodo}>{p.periodo}: {p.total} ocorrências</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}