import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Tabs } from "../../components/ui/Tabs";
import type { AlunoDetalhado, Falta, Nota, OcorrenciaDetalhada } from "../../services/domain";
import { getAlunoDetalhado, listFaltasByAluno, listNotasByAluno, listOcorrenciasDetalhadas } from "../../services/school.service";
import { StatusBadge } from "../ocorrencias/status";

export function PerfilAlunoPage() {
  const { id } = useParams();
  const [active, setActive] = useState("ocorrencias");
  const [aluno, setAluno] = useState<AlunoDetalhado | null>(null);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDetalhada[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activeRequest = true;

    async function load() {
      if (!id) return;
      try {
        const [nextAluno, nextOcorrencias, nextNotas, nextFaltas] = await Promise.all([
          getAlunoDetalhado(id),
          listOcorrenciasDetalhadas(),
          listNotasByAluno(id),
          listFaltasByAluno(id)
        ]);
        if (!activeRequest) return;
        setAluno(nextAluno);
        setOcorrencias(nextOcorrencias.filter((item) => item.alunoId === id));
        setNotas(nextNotas);
        setFaltas(nextFaltas);
        setError("");
      } catch (err) {
        if (!activeRequest) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar o historico do aluno.");
      } finally {
        if (activeRequest) setLoading(false);
      }
    }

    void load();

    return () => {
      activeRequest = false;
    };
  }, [id]);

  if (loading && !aluno) {
    return (
      <>
        <PageHeader title="Historico do aluno" breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Alunos", to: "/alunos" }, { label: "Carregando" }]} />
        <Card>
          <p className="muted">Carregando historico...</p>
        </Card>
      </>
    );
  }

  if (!aluno) {
    return (
      <>
        <PageHeader title="Historico do aluno" breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Alunos", to: "/alunos" }, { label: "Nao encontrado" }]} />
        <Card className="state-message state-message--danger">{error || "Aluno nao encontrado."}</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={aluno.nome} breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Alunos", to: "/alunos" }, { label: aluno.nome }]} />
      <div className="page-grid">
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <Card title="Dados do aluno">
          <div className="grid-3">
            <p>
              <strong>Matricula:</strong> {aluno.matricula}
            </p>
            <p>
              <strong>Turma:</strong> {aluno.turma}
            </p>
            <p>
              <strong>Status:</strong> {aluno.ativo ? "Ativo" : "Inativo"}
            </p>
          </div>
        </Card>
        <Card>
          <Tabs
            active={active}
            onChange={setActive}
            items={[
              {
                id: "ocorrencias",
                label: "Ocorrencias",
                content: (
                  <Table
                    data={ocorrencias}
                    columns={[
                      { key: "categoria", header: "Categoria", render: (item) => item.categoria },
                      { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> }
                    ]}
                  />
                )
              },
              {
                id: "notas",
                label: "Notas",
                content: (
                  <Table
                    data={notas}
                    columns={[
                      { key: "disciplina", header: "Disciplina", render: (item) => item.disciplina },
                      { key: "etapa", header: "Etapa", render: (item) => item.etapa },
                      { key: "valor", header: "Valor", render: (item) => item.valor.toFixed(1) }
                    ]}
                  />
                )
              },
              {
                id: "faltas",
                label: "Faltas",
                content: (
                  <Table
                    data={faltas}
                    columns={[
                      { key: "data", header: "Data", render: (item) => item.data },
                      { key: "justificativa", header: "Justificativa", render: (item) => item.justificativa ?? "Sem justificativa" }
                    ]}
                  />
                )
              }
            ]}
          />
        </Card>
      </div>
    </>
  );
}
