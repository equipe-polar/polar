import { CheckCircle2, Clock, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { canAccess, type Permission } from "../../app/permissions";
import { useAuth } from "../../app/providers";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { OcorrenciaDetalhada, OcorrenciaHistorico, StatusOcorrencia } from "../../services/domain";
import { getOcorrenciaDetalhada, listHistoricoOcorrencia, updateOcorrenciaStatus } from "./ocorrencias.service";
import { PrioridadeBadge, StatusBadge } from "./status";

interface StatusAction {
  label: string;
  status: StatusOcorrencia;
  permission: Permission;
}

const statusActions: StatusAction[] = [
  { label: "Colocar em analise", status: "EM_ANALISE", permission: "ocorrencias:status:analise" },
  { label: "Marcar resolvida", status: "RESOLVIDA", permission: "ocorrencias:status:resolver" },
  { label: "Encerrar", status: "ENCERRADA", permission: "ocorrencias:status:encerrar" }
];

const expectedCurrentStatus: Record<StatusOcorrencia, StatusOcorrencia> = {
  EM_ANALISE: "REGISTRADA",
  RESOLVIDA: "EM_ANALISE",
  ENCERRADA: "RESOLVIDA",
  REGISTRADA: "REGISTRADA"
};

export function DetalheOcorrenciaPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ocorrencia, setOcorrencia] = useState<OcorrenciaDetalhada | null>(null);
  const [historico, setHistorico] = useState<OcorrenciaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [observacao, setObservacao] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [nextOcorrencia, nextHistorico] = await Promise.all([getOcorrenciaDetalhada(id), listHistoricoOcorrencia(id)]);
      setOcorrencia(nextOcorrencia);
      setHistorico(nextHistorico);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar a ocorrencia.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const actions = useMemo(() => {
    if (!ocorrencia) return [];
    return statusActions.filter(
      (action) =>
        canAccess(user?.papel, action.permission) &&
        ocorrencia.status === expectedCurrentStatus[action.status]
    );
  }, [ocorrencia, user?.papel]);

  async function changeStatus(status: StatusOcorrencia) {
    if (!id) return;
    setUpdating(true);
    setError("");
    try {
      await updateOcorrenciaStatus(id, status, observacao);
      setObservacao("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel alterar o status.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading && !ocorrencia) {
    return (
      <>
        <PageHeader title="Detalhe da ocorrencia" breadcrumb={[{ label: "Ocorrencias", to: "/ocorrencias" }, { label: "Carregando" }]} />
        <Card>
          <p className="muted">Carregando ocorrencia...</p>
        </Card>
      </>
    );
  }

  if (!ocorrencia) {
    return (
      <>
        <PageHeader title="Detalhe da ocorrencia" breadcrumb={[{ label: "Ocorrencias", to: "/ocorrencias" }, { label: "Nao encontrada" }]} />
        <Card className="state-message state-message--danger">{error || "Ocorrencia nao encontrada."}</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Detalhe da ocorrencia" breadcrumb={[{ label: "Ocorrencias", to: "/ocorrencias" }, { label: ocorrencia.id }]} />
      <div className="page-grid">
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <div className="grid-2">
          <Card title="Dados gerais">
            <p>
              <strong>Aluno:</strong> {ocorrencia.aluno}
            </p>
            <p>
              <strong>Turma:</strong> {ocorrencia.turma}
            </p>
            <p>
              <strong>Categoria:</strong> {ocorrencia.categoria}
            </p>
            <div className="actions-row">
              <StatusBadge status={ocorrencia.status} />
              <PrioridadeBadge prioridade={ocorrencia.prioridade} />
            </div>
          </Card>
          <Card title="Acoes permitidas">
            {actions.length > 0 ? (
              <div className="page-grid">
                <label className="field">
                  <span className="field-label">Observacao / encaminhamento (opcional)</span>
                  <textarea
                    className="input"
                    rows={3}
                    maxLength={500}
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    placeholder="Ex: conversa realizada com o aluno; familia comunicada."
                  />
                </label>
                <div className="actions-row">
                  {actions.map((action) => (
                    <Button
                      key={action.status}
                      disabled={updating}
                      onClick={() => void changeStatus(action.status)}
                      icon={action.status === "ENCERRADA" ? <Lock size={18} /> : action.status === "RESOLVIDA" ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
                <p className="muted">A observacao e gravada no historico junto com a mudanca de status.</p>
              </div>
            ) : (
              <p className="muted">Nenhuma acao disponivel para o perfil atual.</p>
            )}
          </Card>
        </div>
        <Card title="Descricao">
          <p>{ocorrencia.descricao}</p>
          <p className="muted">Local: {ocorrencia.local || "Nao informado"}</p>
          <p className="muted">Testemunhas: {ocorrencia.testemunhas || "Nao informado"}</p>
        </Card>
        <Card title="Historico">
          <ol className="timeline">
            {historico.map((item) => (
              <li key={item.id}>
                <strong>{item.acao}</strong>
                <span className="muted">
                  {item.status} por {item.usuarioId}
                </span>
                {item.observacao ? <span className="muted">Observacao: {item.observacao}</span> : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
