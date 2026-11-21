export const RESOURCES = ['projetor', 'ar-condicionado', 'quadro-branco', 'computadores'] as const

export type Resource = (typeof RESOURCES)[number]

export interface Room {
  id: string
  name: string
  capacity: number
  resources: Resource[]
}

export interface Reservation {
  id: string
  roomId: string
  owner: string
  /** Data no formato YYYY-MM-DD */
  date: string
  /** Horário no formato HH:MM */
  start: string
  /** Horário no formato HH:MM */
  end: string
}

export type NewRoom = Omit<Room, 'id'>
export type NewReservation = Omit<Reservation, 'id'>

export interface Clock {
  now(): Date
}
