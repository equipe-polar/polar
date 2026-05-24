const { sanitizeString } = require("../util/validation");

class Notification {
  constructor(payload = {}) {
    this.id = payload.id;
    this.title = sanitizeString(payload.title || payload.titulo, 160);
    this.message = sanitizeString(payload.message || payload.mensagem || payload.description, 1000);
    this.type = sanitizeString(payload.type || payload.tipo || "sistema", 80);
    this.recipient = sanitizeString(payload.recipient || payload.destinatario, 160);
    this.occurrenceId = sanitizeString(payload.occurrenceId || payload.ocorrencia_id, 80);
    this.createdAt = payload.createdAt || payload.criado_em;
  }

  validateForCreate() {
    if (!this.title) {
      throw Object.assign(new Error("Titulo da notificacao e obrigatorio."), { status: 400 });
    }
    if (!this.message) {
      throw Object.assign(new Error("Mensagem da notificacao e obrigatoria."), { status: 400 });
    }
  }

  toPayload() {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      type: this.type,
      recipient: this.recipient,
      occurrenceId: this.occurrenceId,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Notification;
