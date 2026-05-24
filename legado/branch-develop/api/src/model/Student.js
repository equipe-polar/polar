const { sanitizeString } = require("../util/validation");

class Student {
  constructor(payload = {}) {
    this.id = payload.id;
    this.name = sanitizeString(payload.name || payload.nome, 120);
    this.class = sanitizeString(payload.class || payload.room || payload.turma || payload.sala, 80);
    this.registration = sanitizeString(payload.registration || payload.matricula, 80);
    this.responsibleName = sanitizeString(payload.responsibleName || payload.nomeResponsavel, 120);
    this.responsibleContact = sanitizeString(payload.responsibleContact || payload.contatoResponsavel, 120);
    this.createdAt = payload.createdAt || payload.criado_em;
  }

  validateForCreate() {
    if (!this.name) {
      throw Object.assign(new Error("Nome do aluno e obrigatorio."), { status: 400 });
    }
    if (!this.class) {
      throw Object.assign(new Error("Turma do aluno e obrigatoria."), { status: 400 });
    }
  }

  toPayload() {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      registration: this.registration,
      responsibleName: this.responsibleName,
      responsibleContact: this.responsibleContact,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Student;
