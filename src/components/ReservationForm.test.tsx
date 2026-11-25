import { render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../domain/errors'
import type { Room } from '../domain/types'
import { ReservationForm } from './ReservationForm'

const rooms: Room[] = [
  { id: '1', name: 'Sala 101', capacity: 30, resources: [] },
  { id: '2', name: 'Auditório', capacity: 120, resources: [] },
]

async function preencherReserva(user: UserEvent) {
  await user.selectOptions(screen.getByLabelText('Escolha a sala'), 'Auditório (120 lugares)')
  await user.type(screen.getByLabelText('Responsável'), 'Maria')
  await user.type(screen.getByLabelText('Data da reserva'), '2026-12-01')
  await user.type(screen.getByLabelText('Início'), '09:00')
  await user.type(screen.getByLabelText('Término'), '10:30')
}

describe('ReservationForm', () => {
  it('oferece as salas cadastradas como opções, com a capacidade', () => {
    render(<ReservationForm rooms={rooms} onCreate={vi.fn()} />)

    expect(screen.getByRole('option', { name: 'Sala 101 (30 lugares)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Auditório (120 lugares)' })).toBeInTheDocument()
  })

  it('envia sala, responsável, data e horários ao reservar', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()
    render(<ReservationForm rooms={rooms} onCreate={onCreate} />)

    await preencherReserva(user)
    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(onCreate).toHaveBeenCalledWith({
      roomId: '2',
      owner: 'Maria',
      date: '2026-12-01',
      start: '09:00',
      end: '10:30',
    })
  })

  it('confirma a criação da reserva', async () => {
    const user = userEvent.setup()
    render(<ReservationForm rooms={rooms} onCreate={vi.fn()} />)

    await preencherReserva(user)
    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(screen.getByRole('status')).toHaveTextContent('Reserva criada com sucesso.')
  })

  it('limpa responsável e horários, mas mantém sala e data, após reservar', async () => {
    const user = userEvent.setup()
    render(<ReservationForm rooms={rooms} onCreate={vi.fn()} />)

    await preencherReserva(user)
    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(screen.getByLabelText('Responsável')).toHaveValue('')
    expect(screen.getByLabelText('Início')).toHaveValue('')
    expect(screen.getByLabelText('Término')).toHaveValue('')
    expect(screen.getByLabelText('Escolha a sala')).toHaveValue('2')
    expect(screen.getByLabelText('Data da reserva')).toHaveValue('2026-12-01')
  })

  it('exibe o erro e não confirma quando a reserva é recusada', async () => {
    const onCreate = vi.fn(() => {
      throw new ValidationError('TIME_CONFLICT', 'A sala já está reservada nesse horário.')
    })
    const user = userEvent.setup()
    render(<ReservationForm rooms={rooms} onCreate={onCreate} />)

    await preencherReserva(user)
    await user.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('A sala já está reservada nesse horário.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
