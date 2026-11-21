/** Regras de negócio configuráveis do ReservaAi. */
export const BUSINESS_RULES = {
  /** Abertura do prédio, em minutos (07:00) */
  openingMinutes: 7 * 60,
  /** Fechamento do prédio, em minutos (22:00) */
  closingMinutes: 22 * 60,
  /** Duração máxima de uma reserva, em minutos (4h) */
  maxDurationMinutes: 4 * 60,
} as const
