# ReservaAi

## Integrantes

- Gabriel Faria
- João Henrique Alves Martins
- João Paulo Moura Furtado

## Sobre o sistema

O **ReservaAi** é um sistema web para reserva de salas. Funcionalidades:

- Cadastro de salas (nome, capacidade e recursos, como projetor e ar-condicionado)
- Criação de reservas (sala, responsável, data, horário de início e de fim)
- **Bloqueio de conflitos de horário** na mesma sala (regra central)
- Validações: o fim deve ser depois do início, não é possível reservar no passado, as reservas devem ficar dentro do horário de funcionamento (07:00–22:00) e durar no máximo 4 horas
- Listagem e filtro de reservas por sala ou data
- Cancelamento de reservas
- Busca de salas disponíveis em um horário, com capacidade mínima

Os dados são armazenados no `localStorage` do navegador: eles persistem após recarregar a página, mas não são compartilhados entre navegadores ou dispositivos. O bloqueio de conflitos considera apenas os dados armazenados naquele navegador.

## Tecnologias

- **TypeScript + React**: interface web
- **Vite**: servidor de desenvolvimento e build
- **Vitest + Testing Library**: testes de unidade e de componentes
- **@vitest/coverage-v8**: medição de cobertura (mínimo de 80%, verificado no CI)
- **Playwright**: testes end-to-end
- **GitHub Actions**: CI em Linux, macOS e Windows
- **Codecov**: publicação dos relatórios de cobertura
- **Vercel**: hospedagem em produção

As regras de negócio ficam em `src/domain`, em TypeScript puro e sem dependência do React. Assim, os testes de unidade usam apenas a API pública (`ReservationSystem`) e um relógio fixo, o que deixa o resultado determinístico.

## Uso de IA

## Execução dos testes

Pré-requisito: Node.js 22.22.2 ou superior na versão 22, 24.15.0 ou superior na versão 24, ou versão 26 ou superior. O CI utiliza Node.js 24.

```bash
npm install
npx playwright install chromium   # apenas na primeira vez

npm test              # testes de unidade
npm run coverage      # testes de unidade + relatório de cobertura (em coverage/index.html)
npm run e2e           # testes end-to-end com Playwright
```

Para rodar a aplicação localmente: `npm run dev`.
