const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Converte "HH:MM" em minutos desde a meia-noite. Retorna null se inválido. */
export function toMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Verifica se a string é uma data real no formato YYYY-MM-DD. */
export function isValidDate(date: string): boolean {
  const match = DATE_PATTERN.exec(date)
  if (!match) return false
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const parsed = new Date(year, month - 1, day)
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  )
}

/** Formata um Date (horário local) como YYYY-MM-DD. */
export function formatDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/** Minutos desde a meia-noite (horário local) de um Date. */
export function minutesOfDay(value: Date): number {
  return value.getHours() * 60 + value.getMinutes()
}

/** Dois intervalos [startA, endA) e [startB, endB) se sobrepõem? */
export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}
