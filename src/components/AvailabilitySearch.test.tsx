import { render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../domain/errors'
import type { Room } from '../domain/types'
import { AvailabilitySearch } from './AvailabilitySearch'

const auditorio: Room = { id: '2', name: 'Auditório', capacity: 120, resources: [] }

async function preencherHorario(user: UserEvent) {
  await user.type(screen.getByLabelText('Data da busca'), '2026-12-01')
  await user.type(screen.getByLabelText('Disponível a partir de'), '09:00')
  await user.type(screen.getByLabelText('Disponível até'), '11:00')
}

describe('AvailabilitySearch', () => {
  it('busca pela data, pelo intervalo e pela quantidade de lugares informados', async () => {
    const onSearch = vi.fn(() => [])
    const user = userEvent.setup()
    render(<AvailabilitySearch onSearch={onSearch} />)

    await preencherHorario(user)
    await user.type(screen.getByLabelText('Lugares necessários'), '50')
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))

    expect(onSearch).toHaveBeenCalledWith({
      date: '2026-12-01',
      start: '09:00',
      end: '11:00',
      minCapacity: 50,
    })
  })

  it('busca sem capacidade mínima quando a quantidade de lugares não é informada', async () => {
    const onSearch = vi.fn(() => [])
    const user = userEvent.setup()
    render(<AvailabilitySearch onSearch={onSearch} />)

    await preencherHorario(user)
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))

    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ minCapacity: 0 }))
  })

  it('lista as salas disponíveis encontradas com a capacidade', async () => {
    const user = userEvent.setup()
    render(<AvailabilitySearch onSearch={() => [auditorio]} />)

    await preencherHorario(user)
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))

    const lista = screen.getByRole('list', { name: 'Salas disponíveis encontradas' })
    expect(lista).toHaveTextContent('Auditório — 120 lugares')
  })

  it('informa quando nenhuma sala está disponível', async () => {
    const user = userEvent.setup()
    render(<AvailabilitySearch onSearch={() => []} />)

    await preencherHorario(user)
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))

    expect(screen.getByText('Nenhuma sala disponível nesse horário.')).toBeInTheDocument()
  })

  it('exibe o erro e remove o resultado anterior quando a busca é inválida', async () => {
    const onSearch = vi
      .fn()
      .mockReturnValueOnce([auditorio])
      .mockImplementationOnce(() => {
        throw new ValidationError('END_BEFORE_START', 'O término deve ser depois do início.')
      })
    const user = userEvent.setup()
    render(<AvailabilitySearch onSearch={onSearch} />)

    await preencherHorario(user)
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))
    await user.click(screen.getByRole('button', { name: 'Buscar salas' }))

    expect(screen.getByRole('alert')).toHaveTextContent('O término deve ser depois do início.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
