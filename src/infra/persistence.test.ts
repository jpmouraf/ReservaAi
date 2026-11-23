import { beforeEach, describe, expect, it } from 'vitest'
import { ReservationSystem } from '../domain/reservationSystem'
import { LocalStorageRepository } from './localStorageRepository'

const fixedClock = { now: () => new Date(2030, 2, 10, 8, 0) }
const createSystem = () => new ReservationSystem(new LocalStorageRepository(), fixedClock)

describe('ReservationSystem com localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('continua bloqueando um horário reservado depois de recarregar a página', () => {
    const before = createSystem()
    const room = before.addRoom({ name: 'Sala 101', capacity: 30, resources: [] })
    const slot = { roomId: room.id, owner: 'Ana', date: '2030-03-11', start: '09:00', end: '10:00' }
    before.createReservation(slot)

    const afterReload = createSystem()

    expect(() => afterReload.createReservation({ ...slot, owner: 'Bruno' })).toThrow(
      expect.objectContaining({ code: 'TIME_CONFLICT' }),
    )
  })
})
