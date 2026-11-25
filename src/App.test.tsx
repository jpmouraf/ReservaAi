import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { InMemoryRepository } from './domain/repository'
import { ReservationSystem } from './domain/reservationSystem'

// "Agora" fixo nos testes: 10/03/2030 às 08:00 (horário local)
const fixedClock = { now: () => new Date(2030, 2, 10, 8, 0) }

function criarSistema() {
  return new ReservationSystem(new InMemoryRepository(), fixedClock)
}

async function reservarPeloFormulario(user: UserEvent, start: string, end: string) {
  await user.selectOptions(screen.getByLabelText('Escolha a sala'), 'Sala 101 (30 lugares)')
  await user.type(screen.getByLabelText('Responsável'), 'Maria')
  await user.type(screen.getByLabelText('Data da reserva'), '2030-03-11')
  await user.type(screen.getByLabelText('Início'), start)
  await user.type(screen.getByLabelText('Término'), end)
  await user.click(screen.getByRole('button', { name: 'Reservar' }))
}

describe('App', () => {
  it('exibe o nome do sistema', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'ReservaAi' })).toBeInTheDocument()
  })

  it('exibe a sala cadastrada na lista e entre as opções de reserva', async () => {
    const user = userEvent.setup()
    render(<App system={criarSistema()} />)

    await user.type(screen.getByLabelText('Nome da sala'), 'Sala 101')
    await user.type(screen.getByLabelText('Capacidade'), '30')
    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    const salas = screen.getByRole('region', { name: 'Salas' })
    expect(within(salas).getByRole('row', { name: /Sala 101/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Sala 101 (30 lugares)' })).toBeInTheDocument()
  })

  it('exibe na lista de reservas a reserva criada pelo formulário', async () => {
    const system = criarSistema()
    system.addRoom({ name: 'Sala 101', capacity: 30, resources: [] })
    const user = userEvent.setup()
    render(<App system={system} />)

    await reservarPeloFormulario(user, '09:00', '10:00')

    const reservas = screen.getByRole('region', { name: 'Reservas' })
    const linha = within(reservas).getByRole('row', { name: /Maria/ })
    expect(within(linha).getByText('09:00–10:00')).toBeInTheDocument()
  })

  it('remove da lista a reserva cancelada', async () => {
    const system = criarSistema()
    const sala = system.addRoom({ name: 'Sala 101', capacity: 30, resources: [] })
    system.createReservation({
      roomId: sala.id,
      owner: 'Maria',
      date: '2030-03-11',
      start: '09:00',
      end: '10:00',
    })
    const user = userEvent.setup()
    render(<App system={system} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar reserva de Maria em Sala 101' }))

    expect(screen.getByText('Nenhuma reserva encontrada.')).toBeInTheDocument()
  })

  it('impede uma reserva em conflito de horário e mantém a reserva existente', async () => {
    const system = criarSistema()
    const sala = system.addRoom({ name: 'Sala 101', capacity: 30, resources: [] })
    system.createReservation({
      roomId: sala.id,
      owner: 'Maria',
      date: '2030-03-11',
      start: '09:00',
      end: '11:00',
    })
    const user = userEvent.setup()
    render(<App system={system} />)

    await reservarPeloFormulario(user, '10:00', '12:00')

    expect(screen.getByRole('alert')).toHaveTextContent('A sala já está reservada nesse horário.')
    const reservas = screen.getByRole('region', { name: 'Reservas' })
    expect(within(reservas).getAllByRole('row', { name: /Maria/ })).toHaveLength(1)
  })
})
