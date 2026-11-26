import { expect, test, type Page } from '@playwright/test'

// O relógio fixo permite executar os cenários em qualquer data e fuso horário.
const hoje = new Date('2030-03-10T12:00:00Z')
const data = '2030-03-11'

async function cadastrarSala(page: Page, nome: string, capacidade: string) {
  await page.getByLabel('Nome da sala').fill(nome)
  await page.getByLabel('Capacidade', { exact: true }).fill(capacidade)
  await page.getByRole('button', { name: 'Cadastrar sala' }).click()
}

async function preencherReserva(page: Page, responsavel: string, inicio: string, fim: string) {
  await page.getByLabel('Escolha a sala').selectOption({ label: 'Sala 101 (30 lugares)' })
  await page.getByLabel('Responsável').fill(responsavel)
  await page.getByLabel('Data da reserva').fill(data)
  await page.getByLabel('Início', { exact: true }).fill(inicio)
  await page.getByLabel('Término').fill(fim)
}

async function buscarSalas(page: Page, inicio: string, fim: string, capacidade = '') {
  await page.getByLabel('Data da busca').fill(data)
  await page.getByLabel('Disponível a partir de').fill(inicio)
  await page.getByLabel('Disponível até').fill(fim)
  await page.getByLabel('Lugares necessários').fill(capacidade)
  await page.getByRole('button', { name: 'Buscar salas' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(hoje)
  await page.goto('/')
})

test('cadastra sala com recursos e rejeita nome duplicado', async ({ page }) => {
  await page.getByLabel('Nome da sala').fill('Sala 101')
  await page.getByLabel('Capacidade', { exact: true }).fill('30')
  await page.getByLabel('Projetor').check()
  await page.getByLabel('Ar-condicionado').check()
  await page.getByRole('button', { name: 'Cadastrar sala' }).click()

  const salas = page.getByRole('region', { name: 'Salas', exact: true })
  await expect(salas.getByRole('row', { name: /Sala 101/ })).toContainText('30')
  await expect(salas.getByRole('row', { name: /Sala 101/ })).toContainText('Projetor')
  await expect(salas.getByRole('row', { name: /Sala 101/ })).toContainText('Ar-condicionado')

  await cadastrarSala(page, 'sala 101', '20')
  await expect(page.getByRole('alert')).toContainText('Já existe uma sala')
  await expect(salas.getByRole('row', { name: /sala 101/i })).toHaveCount(1)
})

test('mantém reserva após recarregar, rejeita conflito e libera horário ao cancelar', async ({ page }) => {
  await cadastrarSala(page, 'Sala 101', '30')
  await preencherReserva(page, 'Ana', '09:00', '10:00')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Reserva criada com sucesso.')

  await page.reload()
  const reservas = page.getByRole('region', { name: 'Reservas', exact: true })
  await expect(reservas.getByRole('row', { name: /Ana/ })).toContainText('11/03/2030')
  await expect(reservas.getByRole('row', { name: /Ana/ })).toContainText('09:00–10:00')

  await preencherReserva(page, 'Bruno', '09:30', '10:30')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('A sala já está reservada nesse horário.')
  await expect(reservas.getByRole('row', { name: /Bruno/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Cancelar reserva de Ana em Sala 101' }).click()
  await expect(reservas.getByText('Nenhuma reserva encontrada.')).toBeVisible()
  await page.reload()
  await expect(reservas.getByText('Nenhuma reserva encontrada.')).toBeVisible()

  await preencherReserva(page, 'Bruno', '09:30', '10:30')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()
  await expect(reservas.getByRole('row', { name: /Bruno/ })).toBeVisible()
})

test('busca salas por disponibilidade e capacidade e aplica filtros de reserva', async ({ page }) => {
  await cadastrarSala(page, 'Sala 101', '30')
  await cadastrarSala(page, 'Auditório', '100')
  await preencherReserva(page, 'Ana', '09:00', '10:00')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()

  await buscarSalas(page, '09:30', '10:30', '20')
  const disponiveis = page.getByRole('list', { name: 'Salas disponíveis encontradas' })
  await expect(disponiveis).toContainText('Auditório — 100 lugares')
  await expect(disponiveis).not.toContainText('Sala 101')

  await buscarSalas(page, '10:00', '11:00', '30')
  await expect(disponiveis.getByRole('listitem')).toHaveCount(2)
  await buscarSalas(page, '10:00', '11:00', '101')
  await expect(page.getByText('Nenhuma sala disponível nesse horário.')).toBeVisible()

  const reservas = page.getByRole('region', { name: 'Reservas', exact: true })
  await page.getByLabel('Filtrar por sala').selectOption({ label: 'Auditório' })
  await expect(reservas.getByText('Nenhuma reserva encontrada.')).toBeVisible()
  await page.getByLabel('Filtrar por sala').selectOption({ label: 'Sala 101' })
  await page.getByLabel('Filtrar por data').fill('2030-03-12')
  await expect(reservas.getByText('Nenhuma reserva encontrada.')).toBeVisible()
  await page.getByLabel('Filtrar por data').fill(data)
  await expect(reservas.getByRole('row', { name: /Ana/ })).toBeVisible()
})

test('exibe erro de validação e não cria reserva inválida', async ({ page }) => {
  await cadastrarSala(page, 'Sala 101', '30')
  await preencherReserva(page, 'Ana', '11:00', '10:00')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()

  await expect(page.getByRole('alert')).toHaveText('O fim deve ser depois do início.')
  await expect(page.getByText('Nenhuma reserva encontrada.')).toBeVisible()
})

test('permite reservas consecutivas na mesma sala', async ({ page }) => {
  await cadastrarSala(page, 'Sala 101', '30')
  await preencherReserva(page, 'Ana', '09:00', '10:00')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()
  await preencherReserva(page, 'Bruno', '10:00', '11:00')
  await page.getByRole('button', { name: 'Reservar', exact: true }).click()

  const reservas = page.getByRole('region', { name: 'Reservas', exact: true })
  await expect(reservas.getByRole('row', { name: /Ana/ })).toContainText('09:00–10:00')
  await expect(reservas.getByRole('row', { name: /Bruno/ })).toContainText('10:00–11:00')
})
