import { Badge } from "../../components/ui/Badge";
import { PRIORIDADE_LABEL, type PrioridadeOcorrencia, type StatusOcorrencia } from "../../services/domain";

export function StatusBadge({ status }: { status: StatusOcorrencia }) {
  const tone = status === "ENCERRADA" || status === "RESOLVIDA" ? "success" : status === "EM_ANALISE" ? "warning" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

export function PrioridadeBadge({ prioridade }: { prioridade: PrioridadeOcorrencia }) {
  const tone = prioridade === "ALTA" ? "danger" : prioridade === "MEDIA" ? "warning" : "success";
  return <Badge tone={tone}>{PRIORIDADE_LABEL[prioridade]}</Badge>;
}
