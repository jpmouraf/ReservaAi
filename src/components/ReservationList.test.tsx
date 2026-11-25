import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Reservation, Room } from '../domain/types'
import { ReservationList } from './ReservationList'

const rooms: Room[] = [
  { id: '1', name: 'Sala 101', capacity: 30, resources: [] },
  { id: '2', name: 'Auditório', capacity: 120, resources: [] },
]

const reservaMaria: Reservation = {
  id: 'r1',
  roomId: '2',
  owner: 'Maria',
  date: '2026-12-01',
  start: '09:00',
  end: '10:30',
}

const reservaJoao: Reservation = {
  id: 'r2',
  roomId: '1',
  owner: 'João',
  date: '2026-12-02',
  start: '14:00',
  end: '15:00',
}

describe('ReservationList', () => {
  it('informa quando não há reservas', () => {
    render(<ReservationList rooms={rooms} listReservations={() => []} onCancel={vi.fn()} />)

    expect(screen.getByText('Nenhuma reserva encontrada.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('exibe sala, responsável, data no formato brasileiro e horário de cada reserva', () => {
    render(
      <ReservationList rooms={rooms} listReservations={() => [reservaMaria]} onCancel={vi.fn()} />,
    )

    const linha = screen.getByRole('row', { name: /Maria/ })
    expect(within(linha).getByText('Auditório')).toBeInTheDocument()
    expect(within(linha).getByText('01/12/2026')).toBeInTheDocument()
    expect(within(linha).getByText('09:00–10:30')).toBeInTheDocument()
  })

  it('indica quando a sala da reserva não existe mais', () => {
    render(
      <ReservationList rooms={[]} listReservations={() => [reservaMaria]} onCancel={vi.fn()} />,
    )

    const linha = screen.getByRole('row', { name: /Maria/ })
    expect(within(linha).getByText('Sala removida')).toBeInTheDocument()
  })

  it('busca as reservas da sala escolhida no filtro', async () => {
    const listReservations = vi.fn(() => [])
    const user = userEvent.setup()
    render(
      <ReservationList rooms={rooms} listReservations={listReservations} onCancel={vi.fn()} />,
    )

    await user.selectOptions(screen.getByLabelText('Filtrar por sala'), 'Sala 101')

    expect(listReservations).toHaveBeenLastCalledWith({ roomId: '1', date: undefined })
  })

  it('busca as reservas da data escolhida no filtro', async () => {
    const listReservations = vi.fn(() => [])
    const user = userEvent.setup()
    render(
      <ReservationList rooms={rooms} listReservations={listReservations} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByLabelText('Filtrar por data'), '2026-12-02')

    expect(listReservations).toHaveBeenLastCalledWith({ roomId: undefined, date: '2026-12-02' })
  })

  it('cancela a reserva escolhida', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ReservationList
        rooms={rooms}
        listReservations={() => [reservaMaria, reservaJoao]}
        onCancel={onCancel}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Cancelar reserva de Maria em Auditório' }),
    )

    expect(onCancel).toHaveBeenCalledWith('r1')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
