import type { Resource } from "../domain/types";

export const RESOURCE_LABELS: Record<Resource, string> = {
  projetor: "Projetor",
  "ar-condicionado": "Ar-condicionado",
  "quadro-branco": "Quadro branco",
  computadores: "Computadores",
};

export function formatDateBR(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
