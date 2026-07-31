import { Eye, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import type { OcorrenciaDetalhada } from "../../services/domain";
import { useAuth } from "../../app/providers";
import { listOcorrenciasDetalhadas } from "./ocorrencias.service";
import { DiasEmAberto } from "./DiasEmAberto";
import { PrioridadeBadge, StatusBadge } from "./status";

export function OcorrenciasListPage() {
  const { user } = useAuth();
  const [aluno, setAluno] = useState("");
  const [status, setStatus] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await listOcorrenciasDetalhadas();
        if (!active) return;
        setOcorrencias(data);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as ocorrencias.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      ocorrencias.filter(
        (item) =>
          item.aluno.toLowerCase().includes(aluno.toLowerCase()) &&
          (!status || item.status === status) &&
          (!prioridade || item.prioridade === prioridade) &&
          (!categoria || item.categoria.toLowerCase().includes(categoria.toLowerCase()))
      ),
    [aluno, categoria, ocorrencias, prioridade, status]
  );

  return (
    <>
      <PageHeader
        title={user?.papel === "PROFESSOR" ? "Minhas ocorrencias" : "Ocorrencias"}
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Ocorrencias" }]}
        actions={
          <Link to="/ocorrencias/nova">
            <Button icon={<Plus size={18} />}>Nova ocorrencia</Button>
          </Link>
        }
      />
      <div className="page-grid">
        <Card title="Filtros">
          <div className="form-grid">
            <Input label="Aluno" value={aluno} onChange={(event) => setAluno(event.target.value)} />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: "Todos", value: "" },
                { label: "REGISTRADA", value: "REGISTRADA" },
                { label: "EM_ANALISE", value: "EM_ANALISE" },
                { label: "RESOLVIDA", value: "RESOLVIDA" },
                { label: "ENCERRADA", value: "ENCERRADA" }
              ]}
            />
            <Select
              label="Prioridade"
              value={prioridade}
              onChange={(event) => setPrioridade(event.target.value)}
              options={[
                { label: "Todas", value: "" },
                { label: "BAIXA", value: "BAIXA" },
                { label: "MEDIA", value: "MEDIA" },
                { label: "ALTA", value: "ALTA" }
              ]}
            />
            <Input label="Categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)} />
          </div>
        </Card>
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <Card title="Lista">
          {loading ? (
            <p className="muted">Carregando ocorrencias...</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <strong>{ocorrencias.length === 0 ? "Nenhuma ocorrencia no seu escopo." : "Nenhum resultado para estes filtros."}</strong>
              <span>
                {ocorrencias.length === 0
                  ? "Assim que houver registros visiveis para o seu perfil, eles aparecem aqui."
                  : "Ajuste ou limpe os filtros acima para ver mais registros."}
              </span>
            </div>
          ) : (
            <Table
              data={filtered}
              columns={[
                { key: "aluno", header: "Aluno", render: (item) => item.aluno },
                { key: "categoria", header: "Categoria", render: (item) => item.categoria },
                { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
                { key: "prioridade", header: "Prioridade", render: (item) => <PrioridadeBadge prioridade={item.prioridade} /> },
                {
                  key: "aberta",
                  header: "Em aberto",
                  render: (item) => <DiasEmAberto desde={item.criadoEm} status={item.status} />
                },
                {
                  key: "acao",
                  header: "Acao",
                  render: (item) => (
                    <Link to={`/ocorrencias/${item.id}`} aria-label={`Visualizar ocorrencia de ${item.aluno}`}>
                      <Button variant="ghost" icon={<Eye size={18} />}>
                        Visualizar
                      </Button>
                    </Link>
                  )
                }
              ]}
            />
          )}
        </Card>
      </div>
    </>
  );
}
