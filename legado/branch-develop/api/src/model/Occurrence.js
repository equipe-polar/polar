const { normalizeSeverity, normalizeStatus, sanitizeString } = require("../util/validation");

class Occurrence {
  constructor(payload = {}) {
    this.id = payload.id;
    this.studentId = sanitizeString(payload.studentId || payload.aluno_id, 80);
    this.studentName = sanitizeString(payload.studentName || payload.student || payload.aluno, 120);
    this.type = sanitizeString(payload.type || payload.category || payload.categoria, 120);
    this.description = sanitizeString(payload.description || payload.descricao, 2000);
    this.severity = normalizeSeverity(payload.severity || payload.priority || payload.prioridade);
    this.status = normalizeStatus(payload.status);
    this.createdBy = sanitizeString(payload.createdBy || payload.criado_por, 120);
    this.createdAt = payload.createdAt || payload.criado_em;
    this.updatedAt = payload.updatedAt || payload.atualizado_em;
  }

  validateForCreate() {
    if (!this.studentId && !this.studentName) {
      throw Object.assign(new Error("Aluno da ocorrencia e obrigatorio."), { status: 400 });
    }
    if (!this.type) {
      throw Object.assign(new Error("Tipo da ocorrencia e obrigatorio."), { status: 400 });
    }
    if (!this.description || this.description.length < 10) {
      throw Object.assign(new Error("Descricao deve ter pelo menos 10 caracteres."), { status: 400 });
    }
  }

  toPayload() {
    return {
      id: this.id,
      studentId: this.studentId,
      studentName: this.studentName,
      type: this.type,
      description: this.description,
      severity: this.severity,
      status: this.status,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Occurrence;
