# Assumptions

1. Each queue belongs to one location and tenant.
2. Server-generated UTC `joinedAt` determines queue order.
3. ETA is `position * averageServiceMinutes` as a simple assessment-level estimate.
4. Idempotency keys are scoped to tenant + queue and are required for join.
5. Tenant identity comes only from a verified JWT claim.
6. Staff can list, call and complete waiting customers; customers can check their own tenant's entry.
7. `Called -> Served` and `Called -> NoShow` are terminal transitions for this scope.
8. Empty `call-next` returns 404.
9. The event outbox is the durability boundary; immediate broker publication is an optimization.
10. SMS provider integration is represented by a consumer abstraction.
11. In-memory persistence is used because the brief explicitly allows it when Cosmos Emulator is not used.
12. Process-local locking is not considered the production concurrency mechanism.
13. PII should not be placed in ordinary application logs.

The brief leaves some details open, so these assumptions make those choices explicit. fileciteturn0file0L31-L35
