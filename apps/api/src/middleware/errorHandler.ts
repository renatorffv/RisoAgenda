import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Dados inválidos", details: err.flatten() });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  console.error(err);
  const debugMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  res.status(500).json({ error: "Erro interno do servidor", debug: debugMessage });
}
