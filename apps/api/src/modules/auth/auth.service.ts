import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AppConfig } from "../../shared/config.js";
import { PapelUsuario, usuarioPublico, type Usuario } from "../../shared/domain.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";
import { AppError, unauthorized } from "../../shared/errors/app-error.js";
import type { UserRepository } from "../../shared/database/repositories/user.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import type { LoginResult } from "./auth.types.js";

const MAX_TENTATIVAS_INVALIDAS = 5;
const LOCK_MINUTES = 15;

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly config: AppConfig
  ) {}

  // Guarda por e-mail especifico (nao por "banco vazio"): permite que o admin
  // real coexista com os dados de demonstracao do seed, em qualquer ordem de boot.
  async bootstrapAdminIfNeeded(): Promise<void> {
    // A checagem da senha vem antes da consulta ao banco de proposito: em serverless
    // este metodo roda a cada cold start, e sem BOOTSTRAP_ADMIN_PASSWORD definida ele
    // nao tem nada a fazer -- nao vale gastar uma ida ao banco por invocacao.
    const password = this.config.bootstrapAdminPassword;
    if (!password) {
      console.log("bootstrap ignorado: BOOTSTRAP_ADMIN_PASSWORD nao definida");
      return;
    }

    const existente = await this.users.findByEmailOrNome(this.config.bootstrapAdminEmail);
    if (existente) {
      console.log(`bootstrap ignorado: usuario ${this.config.bootstrapAdminEmail} ja existe`);
      return;
    }

    if (password === "admin123" && this.config.nodeEnv === "production") {
      throw new Error("Senha bootstrap insegura em producao.");
    }

    const now = agoraIso();
    const usuario: Usuario = {
      id: novoId(),
      nome: "Administrador",
      email: this.config.bootstrapAdminEmail,
      papel: PapelUsuario.ADM,
      senhaHash: await bcrypt.hash(password, 10),
      ativo: true,
      precisaTrocarSenha: true,
      tentativasLoginInvalidas: 0,
      bloqueadoAte: null,
      ultimoLoginEm: null,
      criadoEm: now,
      atualizadoEm: now
    };

    await this.users.create(usuario);
    await this.audit.create({
      id: novoId(),
      usuarioId: usuario.id,
      acao: "BOOTSTRAP_ADMIN_CRIADO",
      entidade: "usuarios",
      entidadeId: usuario.id,
      metadata: { email: usuario.email },
      criadoEm: now
    });
    console.log(`bootstrap: admin ${usuario.email} criado com sucesso`);
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const usuario = await this.users.findByEmailOrNome(identifier);
    if (!usuario || !usuario.ativo) {
      throw unauthorized("Usuario ou senha invalidos.");
    }

    if (usuario.bloqueadoAte && new Date(usuario.bloqueadoAte).getTime() > Date.now()) {
      throw new AppError("Usuario bloqueado temporariamente por tentativas invalidas.", 423, "USER_LOCKED");
    }

    const passwordOk = await bcrypt.compare(password, usuario.senhaHash);
    if (!passwordOk) {
      await this.registerFailedLogin(usuario);
      throw unauthorized("Usuario ou senha invalidos.");
    }

    const now = agoraIso();
    const updated = await this.users.update(usuario.id, (current) => ({
      ...current,
      tentativasLoginInvalidas: 0,
      bloqueadoAte: null,
      ultimoLoginEm: now,
      atualizadoEm: now
    }));

    if (!updated) {
      throw unauthorized("Usuario ou senha invalidos.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: updated.id,
      acao: "LOGIN_SUCESSO",
      entidade: "usuarios",
      entidadeId: updated.id,
      metadata: {},
      criadoEm: now
    });

    const publicUser = usuarioPublico(updated);
    const signOptions: SignOptions = {
      expiresIn: this.config.jwtExpiresIn as Exclude<SignOptions["expiresIn"], undefined>,
      issuer: "pola-api"
    };
    const token = jwt.sign(
      {
        id: publicUser.id,
        nome: publicUser.nome,
        email: publicUser.email,
        papel: publicUser.papel
      },
      this.config.jwtSecret,
      signOptions
    );

    return {
      token,
      user: publicUser
    };
  }

  async alterarSenha(usuarioId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const usuario = await this.users.findById(usuarioId);
    if (!usuario) {
      throw unauthorized();
    }

    const passwordOk = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!passwordOk) {
      throw unauthorized("Senha atual invalida.");
    }

    const now = agoraIso();
    await this.users.update(usuario.id, (current) => ({
      ...current,
      senhaHash: bcrypt.hashSync(novaSenha, 10),
      precisaTrocarSenha: false,
      atualizadoEm: now
    }));

    await this.audit.create({
      id: novoId(),
      usuarioId: usuario.id,
      acao: "SENHA_ALTERADA",
      entidade: "usuarios",
      entidadeId: usuario.id,
      metadata: {},
      criadoEm: now
    });
  }

  private async registerFailedLogin(usuario: Usuario): Promise<void> {
    const attempts = usuario.tentativasLoginInvalidas + 1;
    const blockedUntil =
      attempts >= MAX_TENTATIVAS_INVALIDAS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : usuario.bloqueadoAte;
    const now = agoraIso();

    await this.users.update(usuario.id, (current) => ({
      ...current,
      tentativasLoginInvalidas: attempts,
      bloqueadoAte: blockedUntil,
      atualizadoEm: now
    }));

    await this.audit.create({
      id: novoId(),
      usuarioId: usuario.id,
      acao: "LOGIN_FALHA",
      entidade: "usuarios",
      entidadeId: usuario.id,
      metadata: { tentativas: attempts },
      criadoEm: now
    });
  }
}
