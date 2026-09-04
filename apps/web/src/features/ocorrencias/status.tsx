import { Badge } from "../../components/ui/Badge";
import { PRIORIDADE_LABEL, type PrioridadeOcorrencia, type StatusOcorrencia } from "../../services/domain";

const gravidadePorPrioridade: Record<
  PrioridadeOcorrencia,
  { label: string; marker: string; tone: "success" | "warning" | "danger" | "critical" }
> = {
  BAIXA: { label: "Baixa gravidade", marker: "●", tone: "success" },
  MEDIA: { label: "Gravidade moderada", marker: "●", tone: "warning" },
  ALTA: { label: "Grave", marker: "▲", tone: "danger" },
  URGENTE: { label: "Urgencia", marker: "!", tone: "critical" }
};

export function StatusBadge({ status }: { status: StatusOcorrencia }) {
  const tone = status === "ENCERRADA" || status === "RESOLVIDA" ? "success" : status === "EM_ANALISE" ? "warning" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

export function PrioridadeBadge({ prioridade }: { prioridade: PrioridadeOcorrencia }) {
  const gravidade = gravidadePorPrioridade[prioridade];
  return (
    <Badge tone={gravidade.tone}>
      <span className="severity-badge__marker" aria-hidden="true">{gravidade.marker}</span>
      {PRIORIDADE_LABEL[prioridade]}: {gravidade.label}
    </Badge>
  );
}
