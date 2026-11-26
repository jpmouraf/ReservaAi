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

describe('validação de horários e datas', () => {
  it.each(['9:30', '09:3', '09:60', '24:00', '12:30:00'])
    ('rejeita o horário inválido %s', (horario) => {
      expect(toMinutes(horario)).toBeNull()
    })

  it.each([
    ['2032-02-29', true],
    ['2030-02-29', false],
    ['2030-13-01', false],
    ['2030-04-31', false],
    ['2030-1-01', false],
  ])('valida a data %s', (data, valida) => {
    expect(isValidDate(data)).toBe(valida)
  })
})

describe('intervalsOverlap - posições relativas', () => {
  it.each([
    ['intervalos iguais', 540, 600, 540, 600, true],
    ['primeiro contido no segundo', 550, 590, 540, 600, true],
    ['primeiro contém o segundo', 540, 600, 550, 590, true],
    ['primeiro após o segundo', 660, 720, 540, 600, false],
    ['primeiro começa quando o segundo termina', 600, 660, 540, 600, false],
  ])('verifica %s', (_caso, inicioA, fimA, inicioB, fimB, resultado) => {
    expect(intervalsOverlap(inicioA, fimA, inicioB, fimB)).toBe(resultado)
  })
})
