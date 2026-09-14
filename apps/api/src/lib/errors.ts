export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para essa ação") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de horário") {
    super(message, 409);
  }
}

type AsyncRouteHandler = (...args: any[]) => Promise<any>;

/** Encapsula um handler assíncrono do Express, repassando erros para o middleware de erro. */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: any, res: any, next: any) => {
    handler(req, res, next).catch(next);
  };
}
