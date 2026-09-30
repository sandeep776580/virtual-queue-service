# AI Log

## Tools used

ChatGPT was used for architecture brainstorming, implementation scaffolding, test generation, documentation and review. TypeScript compilation and automated tests were used to verify the output rather than treating generated code as trusted.

## Important prompts

1. "Design a multi-tenant virtual queue backend with tenant isolation, idempotent joins, concurrent call-next, durable events and Cosmos DB."
2. "Review this call-next implementation for race conditions, tenant isolation, async bugs and lost events."
3. "Generate tests for idempotency, cross-tenant access and concurrent call-next."
4. "Propose a Cosmos DB partition-key strategy for a tenant with 500 locations and explain the trade-offs."

## Incorrect/unsafe AI output caught

A naive implementation that reads the oldest waiting entry and then updates it without a concurrency condition can let two staff requests select the same customer. The review identified this race and the implementation added a keyed mutex locally plus a production ETag/conditional-write design.

Another unsafe pattern is swallowing a message publish exception after changing the customer to Called. The implementation instead persists the event in an outbox and leaves it pending when immediate publication fails.

## Estimated AI-generated share

Approximately 60–70% of initial scaffolding was AI-assisted. Architecture decisions, security boundaries, concurrency invariants and verification were reviewed manually.

The assessment asks for 3–5 prompts, a wrong/unsafe AI case, and an estimate of AI-generated code. fileciteturn0file0L42-L45
