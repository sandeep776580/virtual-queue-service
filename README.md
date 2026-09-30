# Multi-Tenant Virtual Queue Service

Node.js + TypeScript implementation of the Backend Lead assessment. It covers tenant isolation, queue join/status, staff call-next, Served/NoShow, idempotency, event publishing, an outbox abstraction, tests, and Cosmos/Azure production design.

## Run

Requires Node.js 20+.

```bash
npm install
npm test
npm run build
npm run dev
```

Demo tenant: `tenant-demo` | Demo queue: `queue-demo` | API: `http://localhost:3000`

## API

`POST /queues/:queueId/join` with `Authorization: Bearer <token>`, `Idempotency-Key`, and `{ "name":"Sandeep", "phone":"9999999999" }`.

`GET /queues/:queueId/entries/:entryId` checks position/ETA.

Staff only: `GET /queues/:queueId/waiting`, `POST /queues/:queueId/call-next`, and `POST /queues/:queueId/entries/:entryId/complete` with `{ "status":"Served" }` or `{ "status":"NoShow" }`.

For local tokens, import `createTestToken` from `src/auth.ts`.

## Design highlights

- Tenant ID comes only from the validated JWT, never a client-controlled tenant header/body.
- Idempotency is scoped to tenant + queue + key and protected by a keyed mutex locally.
- `call-next` is serialized per tenant/queue locally; production must use a persistence-level conditional update/ETag because API replicas cannot share process locks.
- Events are recorded in an outbox before publication. A broker failure therefore leaves a pending event rather than losing the notification.
- The repository boundary has an in-memory implementation for the assessment and a documented Cosmos DB design.

See `ARCHITECTURE.md`, `AI_LOG.md`, `ASSUMPTIONS.md`, and `REVIEW.md`.

The assessment asks for a README, architecture, AI log, assumptions, tests and review artifact. fileciteturn0file0L34-L50
