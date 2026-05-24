import { badRequest } from "../../shared/errors/app-error.js";
import type { Notification } from "../../shared/domain.js";
import type { NotificationRepository } from "../../shared/database/repositories/notification.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";

export class NotificationsService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly audit: AuditRepository
  ) {}

  async list(): Promise<Notification[]> {
    return this.notifications.list();
  }

  async create(
    input: {
      titulo?: string | undefined;
      title?: string | undefined;
      mensagem?: string | undefined;
      message?: string | undefined;
      destinatarioId?: string | null | undefined;
      recipient?: string | null | undefined;
      ocorrenciaId?: string | null | undefined;
      occurrenceId?: string | null | undefined;
    },
    actorId: string
  ): Promise<Notification> {
    const titulo = input.titulo ?? input.title ?? "";
    const mensagem = input.mensagem ?? input.message ?? "";
    if (!titulo || !mensagem) {
      throw badRequest("Titulo e mensagem da notificacao sao obrigatorios.");
    }

    const now = agoraIso();
    const notification: Notification = {
      id: novoId(),
      titulo,
      mensagem,
      destinatarioId: input.destinatarioId ?? input.recipient ?? null,
      ocorrenciaId: input.ocorrenciaId ?? input.occurrenceId ?? null,
      lida: false,
      criadoPorId: actorId,
      criadoEm: now
    };

    await this.notifications.create(notification);
    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "NOTIFICACAO_CRIADA",
      entidade: "notifications",
      entidadeId: notification.id,
      metadata: {},
      criadoEm: now
    });
    return notification;
  }
}
