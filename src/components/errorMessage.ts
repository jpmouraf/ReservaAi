import { ValidationError } from "../domain/errors";

export function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}
