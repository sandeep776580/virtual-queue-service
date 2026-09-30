# Architecture

## Azure deployment

Client -> Azure Front Door/WAF -> Azure Container Apps API -> Cosmos DB + Azure Service Bus. Use Azure Functions or a Container Apps worker as the Service Bus consumer, Key Vault for secrets, and Application Insights/Log Analytics for telemetry.

Container Apps keeps the API stateless and horizontally scalable. Service Bus decouples customer-facing API latency from SMS delivery. The outbox is the durability boundary: state is not considered safely evented merely because an HTTP request to the broker succeeded once.

## Cosmos partition key

Recommended queue-entry logical partition: `/partitionKey`, with value `tenant:{tenantId}:location:{locationId}:queue:{queueId}`. Normal queue operations remain single-partition and a tenant with 500 locations is spread across many logical partitions rather than creating one tenant-hot partition. If measured queue volume becomes extreme, time-bucketed partitions can be introduced, accepting more complex oldest-entry queries.

## Concurrency

The local service uses a keyed mutex so concurrent `call-next` requests cannot select the same entry. This is only a local demonstration. Production must atomically transition `Waiting -> Called` using a Cosmos ETag/conditional write or another Cosmos-supported atomic coordination pattern. On a conflict, re-read the oldest waiting entry and retry.

## 10,000 tenants

Use stateless API replicas, Container Apps autoscaling, Cosmos autoscale throughput and Service Bus consumer scaling. Add per-tenant rate limits, request limits, retries with backoff, dead-letter handling, correlation IDs and distributed tracing.

## Before production

1. Replace stub JWT with trusted OIDC/Entra validation including issuer/audience/signature/tenant claims.
2. Replace process locks with persistence-level concurrency.
3. Implement real Azure Service Bus SDK, duplicate detection and dead-letter recovery.
4. Run an independently scalable outbox dispatcher.
5. Add rate limiting, load/soak/failure-injection tests and SLO alerts.
6. Add PII minimization, retention, auditing and encryption controls.
7. Add readiness/liveness probes and graceful shutdown.

The assessment specifically asks for Azure deployment, Cosmos partitioning for a 500-location tenant, scaling to 10,000 tenants and production changes. fileciteturn0file0L37-L40
