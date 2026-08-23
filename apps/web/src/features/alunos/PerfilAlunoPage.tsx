import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Tabs } from "../../components/ui/Tabs";
import type { AlunoDetalhado, AlunoTurmaHistorico, Falta, Nota, OcorrenciaDetalhada, Turma } from "../../services/domain";
import { getAlunoDetalhado, listFaltasByAluno, listHistoricoTurmas, listNotasByAluno, listOcorrenciasDetalhadas, listTurmas } from "../../services/school.service";
import { StatusBadge } from "../ocorrencias/status";

export function PerfilAlunoPage() {
  const { id } = useParams();
  const [active, setActive] = useState("ocorrencias");
  const [aluno, setAluno] = useState<AlunoDetalhado | null>(null);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDetalhada[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [historicoTurmas, setHistoricoTurmas] = useState<AlunoTurmaHistorico[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activeRequest = true;

    async function load() {
      if (!id) return;
      try {
        const [nextAluno, nextOcorrencias, nextNotas, nextFaltas, nextHistoricoTurmas, nextTurmas] = await Promise.all([
          getAlunoDetalhado(id),
          listOcorrenciasDetalhadas(),
          listNotasByAluno(id),
          listFaltasByAluno(id),
          listHistoricoTurmas(id),
          listTurmas()
        ]);
        if (!activeRequest) return;
        setAluno(nextAluno);
        setOcorrencias(nextOcorrencias.filter((item) => item.alunoId === id));
        setNotas(nextNotas);
        setFaltas(nextFaltas);
        setHistoricoTurmas(nextHistoricoTurmas);
        setTurmas(nextTurmas);
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

  const turmasPorId = new Map(turmas.map((turma) => [turma.id, turma]));
  const historicoTurmasDetalhado = historicoTurmas.map((item) => ({
    ...item,
    turma: turmasPorId.get(item.turmaId)?.nome ?? "Turma nao encontrada"
  }));

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
              },
              {
                id: "turmas",
                label: "Turmas",
                content: (
                  <Table
                    data={historicoTurmasDetalhado}
                    columns={[
                      { key: "ano", header: "Ano letivo", render: (item) => item.anoLetivo },
                      { key: "turma", header: "Turma", render: (item) => item.turma },
                      {
                        key: "registrado", header: "Registrado em", render: (item) => new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                        }).format(new Date(item.criadoEm))
                      }
                    ]}
                    empty="Nenhum vínculo de turma registrado."
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
