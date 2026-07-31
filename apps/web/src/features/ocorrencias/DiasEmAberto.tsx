import { Clock } from "lucide-react";
import type { StatusOcorrencia } from "../../services/domain";

const DIAS_ATENCAO = 4;
const DIAS_CRITICO = 8;

export function diasDesde(iso: string, agora = new Date()): number {
  const inicio = new Date(iso);
  if (Number.isNaN(inicio.getTime())) return 0;
  const dias = Math.floor((agora.getTime() - inicio.getTime()) / 86_400_000);
  return dias < 0 ? 0 : dias;
}

/**
 * Ha quanto tempo a ocorrencia esta aberta.
 *
 * Ocorrencia encerrada nao envelhece -- mostrar "40 dias" num caso ja concluido
 * seria ruido. Nas demais, a cor sobe de neutro para alerta e critico conforme
 * o tempo passa: e o sinal que faz um registro esquecido aparecer na lista.
 */
export function DiasEmAberto({ desde, status }: { desde: string; status: StatusOcorrencia }) {
  if (status === "ENCERRADA") {
    return <span className="muted">—</span>;
  }

  const dias = diasDesde(desde);
  const severidade = dias >= DIAS_CRITICO ? "critico" : dias >= DIAS_ATENCAO ? "alerta" : "normal";
  const texto = dias === 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`;

  return (
    <span className={`aging aging--${severidade}`} title={`Aberta ha ${texto}`}>
      <Clock size={14} aria-hidden="true" />
      {texto}
    </span>
  );
}
