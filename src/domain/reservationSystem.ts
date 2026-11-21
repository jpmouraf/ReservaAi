import { ValidationError } from './errors'
import type { Repository } from './repository'
import { BUSINESS_RULES } from './rules'
import { formatDate, intervalsOverlap, isValidDate, minutesOfDay, toMinutes } from './time'
import {
  RESOURCES,
  type Clock,
  type NewReservation,
  type NewRoom,
  type Reservation,
  type Room,
} from './types'

export interface ReservationFilter {
  roomId?: string
  date?: string
}

export interface AvailabilityQuery {
  date: string
  start: string
  end: string
  minCapacity?: number
}

const systemClock: Clock = { now: () => new Date() }
const randomId = (): string => crypto.randomUUID()

export class ReservationSystem {
  private readonly repo: Repository
  private readonly clock: Clock
  private readonly generateId: () => string

  constructor(
    repo: Repository,
    clock: Clock = systemClock,
    generateId: () => string = randomId,
  ) {
    this.repo = repo
    this.clock = clock
    this.generateId = generateId
  }

  // ---------- Salas ----------

  addRoom(input: NewRoom): Room {
    const name = input.name.trim()
    if (name.length === 0) {
      throw new ValidationError('INVALID_NAME', 'O nome da sala é obrigatório.')
    }
    if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
      throw new ValidationError('INVALID_CAPACITY', 'A capacidade deve ser um inteiro positivo.')
    }
    const invalid = input.resources.find((r) => !RESOURCES.includes(r))
    if (invalid) {
      throw new ValidationError('INVALID_RESOURCE', `Recurso desconhecido: ${invalid}.`)
    }
    const rooms = this.repo.getRooms()
    if (rooms.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      throw new ValidationError('DUPLICATE_ROOM', `Já existe uma sala chamada "${name}".`)
    }

    const room: Room = {
      id: this.generateId(),
      name,
      capacity: input.capacity,
      resources: [...new Set(input.resources)],
    }
    this.repo.saveRooms([...rooms, room])
    return room
  }

  listRooms(): Room[] {
    return this.repo.getRooms().sort((a, b) => a.name.localeCompare(b.name))
  }

  // ---------- Reservas ----------

  createReservation(input: NewReservation): Reservation {
    const owner = input.owner.trim()
    if (!this.repo.getRooms().some((r) => r.id === input.roomId)) {
      throw new ValidationError('ROOM_NOT_FOUND', 'Sala não encontrada.')
    }
    if (owner.length === 0) {
      throw new ValidationError('INVALID_OWNER', 'O responsável é obrigatório.')
    }
    const { start, end } = this.validateSlot(input.date, input.start, input.end)

    if (this.hasConflict(input.roomId, input.date, start, end)) {
      throw new ValidationError('TIME_CONFLICT', 'A sala já está reservada nesse horário.')
    }

    const reservation: Reservation = { ...input, owner, id: this.generateId() }
    this.repo.saveReservations([...this.repo.getReservations(), reservation])
    return reservation
  }

  cancelReservation(id: string): void {
    const reservations = this.repo.getReservations()
    if (!reservations.some((r) => r.id === id)) {
      throw new ValidationError('RESERVATION_NOT_FOUND', 'Reserva não encontrada.')
    }
    this.repo.saveReservations(reservations.filter((r) => r.id !== id))
  }

  listReservations(filter: ReservationFilter = {}): Reservation[] {
    return this.repo
      .getReservations()
      .filter((r) => !filter.roomId || r.roomId === filter.roomId)
      .filter((r) => !filter.date || r.date === filter.date)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  }

  findAvailableRooms(query: AvailabilityQuery): Room[] {
    const { start, end } = this.validateSlot(query.date, query.start, query.end)
    const minCapacity = query.minCapacity ?? 0
    return this.listRooms().filter(
      (room) => room.capacity >= minCapacity && !this.hasConflict(room.id, query.date, start, end),
    )
  }

  // ---------- Regras internas ----------

  private validateSlot(date: string, startText: string, endText: string) {
    if (!isValidDate(date)) {
      throw new ValidationError('INVALID_DATE', 'Data inválida. Use o formato AAAA-MM-DD.')
    }
    const start = toMinutes(startText)
    const end = toMinutes(endText)
    if (start === null || end === null) {
      throw new ValidationError('INVALID_TIME', 'Horário inválido. Use o formato HH:MM.')
    }
    if (end <= start) {
      throw new ValidationError('END_BEFORE_START', 'O fim deve ser depois do início.')
    }
    if (this.isInThePast(date, start)) {
      throw new ValidationError('IN_THE_PAST', 'Não é possível reservar no passado.')
    }
    if (start < BUSINESS_RULES.openingMinutes || end > BUSINESS_RULES.closingMinutes) {
      throw new ValidationError(
        'OUTSIDE_BUSINESS_HOURS',
        'Reservas só podem ocorrer entre 07:00 e 22:00.',
      )
    }
    if (end - start > BUSINESS_RULES.maxDurationMinutes) {
      throw new ValidationError('MAX_DURATION_EXCEEDED', 'A duração máxima é de 4 horas.')
    }
    return { start, end }
  }

  private isInThePast(date: string, startMinutes: number): boolean {
    const now = this.clock.now()
    const today = formatDate(now)
    if (date !== today) return date < today
    return startMinutes < minutesOfDay(now)
  }

  private hasConflict(roomId: string, date: string, start: number, end: number): boolean {
    return this.repo
      .getReservations()
      .some(
        (r) =>
          r.roomId === roomId &&
          r.date === date &&
          intervalsOverlap(start, end, toMinutes(r.start)!, toMinutes(r.end)!),
      )
  }
}
