import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('exibe o nome do sistema', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'ReservaAi' })).toBeInTheDocument()
  })
})
