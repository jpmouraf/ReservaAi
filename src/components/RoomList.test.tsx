import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Room } from '../domain/types'
import { RoomList } from './RoomList'

const sala101: Room = {
  id: '1',
  name: 'Sala 101',
  capacity: 30,
  resources: ['projetor', 'ar-condicionado'],
}

const auditorio: Room = {
  id: '2',
  name: 'Auditório',
  capacity: 120,
  resources: [],
}

describe('RoomList', () => {
  it('informa quando não há salas cadastradas', () => {
    render(<RoomList rooms={[]} />)

    expect(screen.getByText('Nenhuma sala cadastrada.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('exibe uma linha com nome e capacidade para cada sala', () => {
    render(<RoomList rooms={[sala101, auditorio]} />)

    const linhaSala101 = screen.getByRole('row', { name: /Sala 101/ })
    const linhaAuditorio = screen.getByRole('row', { name: /Auditório/ })
    expect(within(linhaSala101).getByText('30')).toBeInTheDocument()
    expect(within(linhaAuditorio).getByText('120')).toBeInTheDocument()
  })

  it('exibe os recursos da sala com nomes legíveis', () => {
    render(<RoomList rooms={[sala101]} />)

    const linha = screen.getByRole('row', { name: /Sala 101/ })
    expect(within(linha).getByText('Projetor, Ar-condicionado')).toBeInTheDocument()
  })

  it('exibe um traço quando a sala não tem recursos', () => {
    render(<RoomList rooms={[auditorio]} />)

    const linha = screen.getByRole('row', { name: /Auditório/ })
    expect(within(linha).getByText('—')).toBeInTheDocument()
  })
})
