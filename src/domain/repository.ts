import type { Reservation, Room } from './types'

export interface Repository {
  getRooms(): Room[]
  saveRooms(rooms: Room[]): void
  getReservations(): Reservation[]
  saveReservations(reservations: Reservation[]): void
}

/** Repositório em memória: usado nos testes de unidade. */
export class InMemoryRepository implements Repository {
  private rooms: Room[] = []
  private reservations: Reservation[] = []

  getRooms() {
    return [...this.rooms]
  }

  saveRooms(rooms: Room[]) {
    this.rooms = [...rooms]
  }

  getReservations() {
    return [...this.reservations]
  }

  saveReservations(reservations: Reservation[]) {
    this.reservations = [...reservations]
  }
}
