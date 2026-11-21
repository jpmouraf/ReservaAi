import { describe, expect, it } from 'vitest'
import { formatDate, intervalsOverlap, isValidDate, toMinutes } from './time'

describe('toMinutes', () => {
  it('converte HH:MM em minutos desde a meia-noite', () => {
    expect(toMinutes('09:30')).toBe(570)
  })

  it('retorna null para horário inexistente', () => {
    expect(toMinutes('25:00')).toBeNull()
  })
})

describe('isValidDate', () => {
  it('aceita uma data real', () => {
    expect(isValidDate('2030-02-28')).toBe(true)
  })

  it('rejeita 30 de fevereiro', () => {
    expect(isValidDate('2030-02-30')).toBe(false)
  })
})

describe('formatDate', () => {
  it('formata com zeros à esquerda', () => {
    expect(formatDate(new Date(2030, 0, 5))).toBe('2030-01-05')
  })
})

describe('intervalsOverlap', () => {
  it('detecta sobreposição parcial', () => {
    expect(intervalsOverlap(540, 600, 570, 630)).toBe(true)
  })

  it('não considera intervalos encostados como sobrepostos', () => {
    expect(intervalsOverlap(540, 600, 600, 660)).toBe(false)
  })
})
