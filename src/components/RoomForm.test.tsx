import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../domain/errors'
import { RoomForm } from './RoomForm'

describe('RoomForm', () => {
  it('envia nome, capacidade e recursos marcados ao cadastrar', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()
    render(<RoomForm onCreate={onCreate} />)

    await user.type(screen.getByLabelText('Nome da sala'), 'Sala 101')
    await user.type(screen.getByLabelText('Capacidade'), '30')
    await user.click(screen.getByLabelText('Projetor'))
    await user.click(screen.getByLabelText('Quadro branco'))
    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Sala 101',
      capacity: 30,
      resources: ['projetor', 'quadro-branco'],
    })
  })

  it('não envia um recurso que foi desmarcado', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()
    render(<RoomForm onCreate={onCreate} />)

    await user.type(screen.getByLabelText('Nome da sala'), 'Sala 101')
    await user.type(screen.getByLabelText('Capacidade'), '30')
    await user.click(screen.getByLabelText('Projetor'))
    await user.click(screen.getByLabelText('Projetor'))
    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ resources: [] }))
  })

  it('limpa o formulário após cadastrar a sala', async () => {
    const user = userEvent.setup()
    render(<RoomForm onCreate={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome da sala'), 'Sala 101')
    await user.type(screen.getByLabelText('Capacidade'), '30')
    await user.click(screen.getByLabelText('Projetor'))
    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    expect(screen.getByLabelText('Nome da sala')).toHaveValue('')
    expect(screen.getByLabelText('Capacidade')).toHaveValue(null)
    expect(screen.getByLabelText('Projetor')).not.toBeChecked()
  })

  it('exibe a mensagem de validação quando o cadastro é recusado', async () => {
    const onCreate = vi.fn(() => {
      throw new ValidationError('INVALID_NAME', 'Informe o nome da sala.')
    })
    const user = userEvent.setup()
    render(<RoomForm onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome da sala.')
  })

  it('exibe uma mensagem genérica quando ocorre um erro inesperado', async () => {
    const onCreate = vi.fn(() => {
      throw new Error('falha qualquer')
    })
    const user = userEvent.setup()
    render(<RoomForm onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar sala' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocorreu um erro inesperado. Tente novamente.',
    )
  })
})
