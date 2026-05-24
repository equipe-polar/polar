export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(message: string, statusCode = 400, code = "APP_ERROR", details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details: unknown = null): AppError {
  return new AppError(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Autenticacao obrigatoria."): AppError {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Perfil sem permissao para esta operacao."): AppError {
  return new AppError(message, 403, "FORBIDDEN");
}

export function notFound(message: string): AppError {
  return new AppError(message, 404, "NOT_FOUND");
}

export function conflict(message: string): AppError {
  return new AppError(message, 409, "CONFLICT");
}
