import { beforeEach, describe, expect, it } from 'vitest'
import type { Reservation, Room } from '../domain/types'
import { LocalStorageRepository, STORAGE_KEYS } from './localStorageRepository'

const room: Room = { id: 'r1', name: 'Sala 101', capacity: 30, resources: ['projetor'] }
const reservation: Reservation = {
  id: 'b1',
  roomId: 'r1',
  owner: 'Ana',
  date: '2030-03-11',
  start: '09:00',
  end: '10:00',
}

describe('LocalStorageRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna listas vazias quando nada foi salvo', () => {
    const repo = new LocalStorageRepository()

    expect(repo.getRooms()).toEqual([])
    expect(repo.getReservations()).toEqual([])
  })

  it('mantém as salas salvas entre instâncias, como ao recarregar a página', () => {
    new LocalStorageRepository().saveRooms([room])

    expect(new LocalStorageRepository().getRooms()).toEqual([room])
  })

  it('mantém as reservas salvas entre instâncias', () => {
    new LocalStorageRepository().saveReservations([reservation])

    expect(new LocalStorageRepository().getReservations()).toEqual([reservation])
  })

  it('ignora dados corrompidos e retorna lista vazia', () => {
    localStorage.setItem(STORAGE_KEYS.rooms, '{isso não é json')

    expect(new LocalStorageRepository().getRooms()).toEqual([])
  })

  it('ignora dados salvos que não são uma lista', () => {
    localStorage.setItem(STORAGE_KEYS.reservations, '{"id":"b1"}')

    expect(new LocalStorageRepository().getReservations()).toEqual([])
  })
})
