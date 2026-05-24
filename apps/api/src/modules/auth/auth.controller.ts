import type { Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../../shared/errors/app-error.js";
import type { Services } from "../../shared/services.js";

export const loginSchema = z.object({
  email: z.string().trim().optional(),
  username: z.string().trim().optional(),
  nome: z.string().trim().optional(),
  password: z.string().min(1).optional(),
  senha: z.string().min(1).optional()
});

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8)
});

function resolveIdentifier(body: z.infer<typeof loginSchema>): string {
  return body.email ?? body.username ?? body.nome ?? "";
}

function resolvePassword(body: z.infer<typeof loginSchema>): string {
  return body.password ?? body.senha ?? "";
}

export class AuthController {
  constructor(private readonly services: Services) {}

  login = async (req: Request, res: Response): Promise<Response> => {
    const body = loginSchema.parse(req.body);
    const identifier = resolveIdentifier(body);
    const password = resolvePassword(body);
    if (!identifier || !password) {
      throw badRequest("Usuario e senha sao obrigatorios.");
    }

    const result = await this.services.auth.login(identifier, password);
    return res.json(result);
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    return res.json({ user: req.usuario });
  };

  alterarSenha = async (req: Request, res: Response): Promise<Response> => {
    const usuario = req.usuario;
    if (!usuario) {
      throw badRequest("Usuario autenticado nao encontrado.");
    }

    const body = changePasswordSchema.parse(req.body);
    await this.services.auth.alterarSenha(usuario.id, body.senhaAtual, body.novaSenha);
    return res.status(204).send();
  };
}
