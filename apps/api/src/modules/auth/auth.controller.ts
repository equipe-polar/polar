import type { Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../../shared/errors/app-error.js";
import { senhaSchema } from "../../shared/validation/senha.js";
import type { Services } from "../../shared/services.js";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "E-mail e obrigatorio."),
  senha: z.string().min(1, "Senha e obrigatoria.")
});

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: senhaSchema
});

export class AuthController {
  constructor(private readonly services: Services) {}

  login = async (req: Request, res: Response): Promise<Response> => {
    const body = loginSchema.parse(req.body);
    const result = await this.services.auth.login(body.email, body.senha);
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
