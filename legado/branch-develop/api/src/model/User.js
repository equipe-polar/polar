const { isEmail, normalizeRole, sanitizeString } = require("../util/validation");

class User {
  constructor(payload = {}) {
    this.id = payload.id;
    this.username = sanitizeString(payload.username || payload.name || payload.nome, 120);
    this.email = sanitizeString(payload.email, 160);
    this.password = payload.password || payload.senha;
    this.passwordHash = payload.passwordHash || payload.password_hash || payload.senha_hash;
    this.role = normalizeRole(payload.role || payload.papel);
    this.createdAt = payload.createdAt || payload.criado_em;
  }

  validateForCreate() {
    if (!this.username) {
      throw Object.assign(new Error("Nome de usuario e obrigatorio."), { status: 400 });
    }
    if (this.email && !isEmail(this.email)) {
      throw Object.assign(new Error("E-mail invalido."), { status: 400 });
    }
    if (!this.password || String(this.password).length < 8) {
      throw Object.assign(new Error("Senha deve ter pelo menos 8 caracteres."), { status: 400 });
    }
  }

  toPayload() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.password,
      passwordHash: this.passwordHash,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
