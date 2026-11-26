import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from './repository'
import { ReservationSystem } from './reservationSystem'
import type { NewReservation, Resource } from './types'

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

describe('ReservationSystem - limites e integridade das reservas', () => {
  it.each([
    ['mesmo intervalo', '09:00', '11:00'],
    ['começa antes e termina durante', '08:00', '10:00'],
    ['começa durante e termina depois', '10:00', '12:00'],
    ['contido no intervalo existente', '09:30', '10:30'],
    ['contém o intervalo existente', '08:00', '12:00'],
  ])('rejeita sobreposição: %s, sem alterar a reserva existente', (_caso, start, end) => {
    const { system, room } = setup()
    const existing = system.createReservation(booking(room.id, { start: '09:00', end: '11:00' }))

    expect(() => system.createReservation(booking(room.id, { owner: 'Bruno', start, end }))).toThrow(
      expect.objectContaining({ code: 'TIME_CONFLICT' }),
    )
    expect(system.listReservations()).toEqual([existing])
  })

  it('permite intervalos encostados antes e depois de uma reserva', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id, { start: '09:00', end: '10:00' }))
    system.createReservation(booking(room.id, { start: '08:00', end: '09:00' }))
    system.createReservation(booking(room.id, { start: '10:00', end: '11:00' }))

    expect(system.listReservations().map((r) => r.start)).toEqual(['08:00', '09:00', '10:00'])
  })

  it.each([
    ['início na abertura', '07:00', '08:00'],
    ['fim no fechamento', '21:00', '22:00'],
    ['duração de quatro horas', '08:00', '12:00'],
  ])('aceita %s', (_caso, start, end) => {
    const { system, room } = setup()

    expect(() => system.createReservation(booking(room.id, { start, end }))).not.toThrow()
  })

  it.each([
    ['datas inexistentes', { date: '2030-02-30' }, 'INVALID_DATE'],
    ['horários inválidos', { start: '24:00' }, 'INVALID_TIME'],
    ['início igual ao fim', { start: '09:00', end: '09:00' }, 'END_BEFORE_START'],
    ['fim após o fechamento', { start: '21:00', end: '22:01' }, 'OUTSIDE_BUSINESS_HOURS'],
    ['mais de quatro horas por um minuto', { start: '08:00', end: '12:01' }, 'MAX_DURATION_EXCEEDED'],
    ['responsável vazio', { owner: '  ' }, 'INVALID_OWNER'],
    ['sala inexistente', { roomId: 'inexistente' }, 'ROOM_NOT_FOUND'],
  ])('rejeita %s sem salvar a reserva', (_caso, changes, code) => {
    const { system, room } = setup()

    expect(() => system.createReservation(booking(room.id, changes))).toThrow(
      expect.objectContaining({ code }),
    )
    expect(system.listReservations()).toEqual([])
  })

  it('rejeita um horário passado no dia atual e aceita o horário atual', () => {
    const { system, room } = setup()

    expect(() =>
      system.createReservation(booking(room.id, { date: '2030-03-10', start: '07:59', end: '09:00' })),
    ).toThrow(expect.objectContaining({ code: 'IN_THE_PAST' }))
    expect(() =>
      system.createReservation(booking(room.id, { date: '2030-03-10', start: '08:00', end: '09:00' })),
    ).not.toThrow()
  })

  it('combina os filtros de sala e data e ordena as reservas por data e início', () => {
    const { system, room } = setup()
    const other = system.addRoom({ name: 'Sala 102', capacity: 10, resources: [] })
    const late = system.createReservation(booking(room.id, { start: '14:00', end: '15:00' }))
    const early = system.createReservation(booking(room.id))
    system.createReservation(booking(room.id, { date: '2030-03-12' }))
    system.createReservation(booking(other.id))

    expect(system.listReservations({ roomId: room.id, date: '2030-03-11' })).toEqual([early, late])
    expect(system.listReservations({ roomId: other.id, date: '2030-03-12' })).toEqual([])
  })
})

describe('ReservationSystem - validação de salas e disponibilidade', () => {
  it('normaliza o nome da sala antes de salvar e verificar duplicidade', () => {
    const { system } = setup()
    const room = system.addRoom({ name: '  Laboratório  ', capacity: 20, resources: [] })

    expect(room.name).toBe('Laboratório')
    expect(() => system.addRoom({ name: ' laboratório ', capacity: 10, resources: [] })).toThrow(
      expect.objectContaining({ code: 'DUPLICATE_ROOM' }),
    )
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejeita a capacidade inválida %s sem cadastrar uma sala',
    (capacity) => {
      const { system } = setup()

      expect(() => system.addRoom({ name: 'Laboratório', capacity, resources: [] })).toThrow(
        expect.objectContaining({ code: 'INVALID_CAPACITY' }),
      )
      expect(system.listRooms()).toHaveLength(1)
    },
  )

  it('rejeita recurso desconhecido sem cadastrar a sala', () => {
    const { system } = setup()

    expect(() =>
      system.addRoom({ name: 'Laboratório', capacity: 20, resources: ['desconhecido' as Resource] }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_RESOURCE' }))
    expect(system.listRooms()).toHaveLength(1)
  })

  it('cadastra cada recurso informado apenas uma vez', () => {
    const { system } = setup()

    const room = system.addRoom({
      name: 'Laboratório',
      capacity: 20,
      resources: ['projetor', 'projetor', 'computadores'],
    })

    expect(room.resources).toEqual(['projetor', 'computadores'])
  })

  it('permite a mesma sala e o mesmo horário em dias diferentes', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id))

    const nextDay = system.createReservation(booking(room.id, { date: '2030-03-12' }))

    expect(system.listReservations()).toHaveLength(2)
    expect(nextDay.date).toBe('2030-03-12')
  })

  it('inclui sala com capacidade exatamente igual à solicitada', () => {
    const { system, room } = setup()

    expect(system.findAvailableRooms({
      date: '2030-03-11', start: '09:00', end: '10:00', minCapacity: 30,
    })).toEqual([room])
  })

  it('retorna a sala ao buscar um horário adjacente à reserva', () => {
    const { system, room } = setup()
    system.createReservation(booking(room.id))

    expect(system.findAvailableRooms({
      date: '2030-03-11', start: '10:00', end: '11:00',
    })).toEqual([room])
  })

  it('rejeita uma busca fora do horário de funcionamento', () => {
    const { system } = setup()

    expect(() => system.findAvailableRooms({
      date: '2030-03-11', start: '21:00', end: '22:01',
    })).toThrow(expect.objectContaining({ code: 'OUTSIDE_BUSINESS_HOURS' }))
  })
})
