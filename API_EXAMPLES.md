# API examples

Generate a local token with `createTestToken` in `src/auth.ts`, then:

```bash
curl -X POST http://localhost:3000/queues/queue-demo/join -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: mobile-123" -H "Content-Type: application/json" -d '{"name":"Sandeep","phone":"9999999999"}'
```

```bash
curl -X POST http://localhost:3000/queues/queue-demo/call-next -H "Authorization: Bearer $TOKEN"
```

```bash
curl http://localhost:3000/queues/queue-demo/waiting -H "Authorization: Bearer $TOKEN"
```
