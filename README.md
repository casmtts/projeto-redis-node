# Projeto Redis + Node.js + TypeScript

Projeto simples e objetivo para apresentação, demonstrando como usar **Redis com Node.js e TypeScript** em um cenário prático de:

- cache de resposta
- contador de visitas
- healthcheck da aplicação e do Redis
- execução local com Docker Compose
- testes automatizados com Vitest

## Stack

- Node.js
- Express
- Redis
- TypeScript
- Docker Compose
- Vitest

## O que este projeto mostra

Este repositório foi pensado para demonstrar valor prático em uma entrevista:

- integração com Redis
- uso de cache com TTL
- leitura e gravação de dados simples
- tratamento básico de erros
- organização em camadas com `app` e `server`
- testes automatizados com mocks
- estrutura enxuta e fácil de evoluir

## Endpoints

- `GET /` - informações da aplicação
- `GET /health` - verifica se a API e o Redis estão saudáveis
- `GET /cache/demo` - retorna um payload usando cache no Redis
- `POST /visits` - incrementa um contador no Redis
- `GET /visits` - consulta o contador atual

## Como executar localmente

### 1. Pré-requisitos

- Node.js 20+
- Redis rodando localmente, ou
- Docker e Docker Compose

### 2. Rodando com Node.js

Instale as dependências:

```bash
npm install
```

Inicie a aplicação:

```bash
npm start
```

Por padrão, a aplicação sobe em `http://localhost:3000`.

### 3. Rodando com Docker Compose

Suba a aplicação e o Redis:

```bash
docker compose up --build
```

### 4. Rodando os testes

```bash
npm test
```

## Testes rápidos com `curl`

```bash
curl http://localhost:3000/health
curl http://localhost:3000/cache/demo
curl -X POST http://localhost:3000/visits
curl http://localhost:3000/visits
```

## Estrutura

```text
.
├── docker-compose.yml
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.ts
├── src
│   ├── app.ts
│   └── server.ts
└── test
    └── app.test.ts
```

## Ideias de evolução

- adicionar autenticação
- criar filas com Redis
- persistir sessões
- adicionar testes automatizados
- publicar em cloud com CI/CD

## Licença

MIT
