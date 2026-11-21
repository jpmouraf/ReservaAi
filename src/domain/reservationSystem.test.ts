import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from './repository'
import { ReservationSystem } from './reservationSystem'
import type { NewReservation } from './types'

// "Agora" fixo nos testes: 10/03/2030 às 08:00 (horário local)
const fixedClock = { now: () => new Date(2030, 2, 10, 8, 0) }

function setup() {
  let counter = 0
  const system = new ReservationSystem(new InMemoryRepository(), fixedClock, () => `id-${++counter}`)
  const room = system.addRoom({ name: 'Sala 101', capacity: 30, resources: ['projetor'] })
  return { system, room }
}

function booking(roomId: string, overrides: Partial<NewReservation> = {}): NewReservation {
  return { roomId, owner: 'Ana', date: '2030-03-11', start: '09:00', end: '10:00', ...overrides }
}

describe('ReservationSystem - criação de reservas', () => {
  it('cria uma reserva válida e a retorna com id', () => {
    const { system, room } = setup()

    const reservation = system.createReservation(booking(room.id))

    expect(reservation).toMatchObject({ roomId: room.id, owner: 'Ana', start: '09:00' })
    expect(reservation.id).toBeDefined()
  })

  it('rejeita reserva que sobrepõe outra na mesma sala', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id, { start: '09:00', end: '11:00' }))

    expect(() =>
      system.createReservation(booking(room.id, { start: '10:00', end: '12:00' })),
    ).toThrow(expect.objectContaining({ code: 'TIME_CONFLICT' }))
  })

  it('permite reserva que começa exatamente quando a anterior termina', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id, { start: '09:00', end: '10:00' }))

    expect(() =>
      system.createReservation(booking(room.id, { start: '10:00', end: '11:00' })),
    ).not.toThrow()
  })

  it('permite o mesmo horário em salas diferentes', () => {
    const { system, room } = setup()
    const other = system.addRoom({ name: 'Sala 102', capacity: 10, resources: [] })
    system.createReservation(booking(room.id))

    expect(() => system.createReservation(booking(other.id))).not.toThrow()
  })

  it('rejeita reserva cujo fim é antes do início', () => {
    const { system, room } = setup()

    expect(() =>
      system.createReservation(booking(room.id, { start: '11:00', end: '10:00' })),
    ).toThrow(expect.objectContaining({ code: 'END_BEFORE_START' }))
  })

  it('rejeita reserva em data passada', () => {
    const { system, room } = setup()

    expect(() => system.createReservation(booking(room.id, { date: '2030-03-09' }))).toThrow(
      expect.objectContaining({ code: 'IN_THE_PAST' }),
    )
  })

  it('rejeita reserva antes das 07:00', () => {
    const { system, room } = setup()

    expect(() =>
      system.createReservation(booking(room.id, { start: '06:30', end: '08:00' })),
    ).toThrow(expect.objectContaining({ code: 'OUTSIDE_BUSINESS_HOURS' }))
  })

  it('rejeita reserva com mais de 4 horas', () => {
    const { system, room } = setup()

    expect(() =>
      system.createReservation(booking(room.id, { start: '08:00', end: '12:30' })),
    ).toThrow(expect.objectContaining({ code: 'MAX_DURATION_EXCEEDED' }))
  })
})

describe('ReservationSystem - salas disponíveis', () => {
  it('não retorna salas ocupadas no horário pedido', () => {
    const { system, room } = setup()
    const free = system.addRoom({ name: 'Sala 102', capacity: 30, resources: [] })
    system.createReservation(booking(room.id))

    const available = system.findAvailableRooms({ date: '2030-03-11', start: '09:30', end: '10:30' })

    expect(available).toEqual([free])
  })

  it('filtra salas pela capacidade mínima', () => {
    const { system, room } = setup()
    system.addRoom({ name: 'Sala Pequena', capacity: 5, resources: [] })

    const available = system.findAvailableRooms({
      date: '2030-03-11',
      start: '09:00',
      end: '10:00',
      minCapacity: 20,
    })

    expect(available).toEqual([room])
  })
})

describe('ReservationSystem - salas', () => {
  it('rejeita sala sem nome', () => {
    const { system } = setup()

    expect(() => system.addRoom({ name: '   ', capacity: 10, resources: [] })).toThrow(
      expect.objectContaining({ code: 'INVALID_NAME' }),
    )
  })

  it('rejeita sala com capacidade zero', () => {
    const { system } = setup()

    expect(() => system.addRoom({ name: 'Auditório', capacity: 0, resources: [] })).toThrow(
      expect.objectContaining({ code: 'INVALID_CAPACITY' }),
    )
  })

  it('rejeita sala com nome repetido, ignorando maiúsculas', () => {
    const { system } = setup()

    expect(() => system.addRoom({ name: 'sala 101', capacity: 10, resources: [] })).toThrow(
      expect.objectContaining({ code: 'DUPLICATE_ROOM' }),
    )
  })

  it('lista as salas em ordem alfabética', () => {
    const { system } = setup()
    system.addRoom({ name: 'Auditório', capacity: 100, resources: [] })

    expect(system.listRooms().map((r) => r.name)).toEqual(['Auditório', 'Sala 101'])
  })
})

describe('ReservationSystem - listagem e cancelamento', () => {
  it('filtra reservas por data', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id, { date: '2030-03-11' }))
    const other = system.createReservation(booking(room.id, { date: '2030-03-12' }))

    expect(system.listReservations({ date: '2030-03-12' })).toEqual([other])
  })

  it('cancela uma reserva e libera o horário', () => {
    const { system, room } = setup()
    const reservation = system.createReservation(booking(room.id))

    system.cancelReservation(reservation.id)

    expect(system.listReservations()).toEqual([])
    expect(() => system.createReservation(booking(room.id))).not.toThrow()
  })

  it('rejeita cancelamento de reserva inexistente', () => {
    const { system } = setup()

    expect(() => system.cancelReservation('nao-existe')).toThrow(
      expect.objectContaining({ code: 'RESERVATION_NOT_FOUND' }),
    )
  })
})
