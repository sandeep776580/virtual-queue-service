# Review of supplied `CallNext`

## P0 — tenant spoofing

`Request.Headers["X-Tenant-Id"]` is client controlled. A caller can substitute another tenant ID. Tenant identity must come from the verified JWT and repository operations must be tenant-scoped.

## P0 — race condition

Two requests can both read the same oldest Waiting entry before either `Upsert` completes. Both can return the same customer. Use a Cosmos ETag/conditional write or another persistence-level atomic transition and retry on conflict.

## P0 — lost event

`catch { }` silently discards Service Bus failures. The requirement says a lost event is a lost customer. Persist an outbox event and retry publication; never silently swallow the failure.

## P1 — blocking async

`.Wait()` blocks a request thread. Use `await` all the way through.

## P1 — local timestamp

`DateTime.Now` is local and ambiguous across replicas. Use UTC (`DateTimeOffset.UtcNow`).

## P1 — excessive query

Materializing every Waiting entry just to select the first is wasteful. Query the oldest entry with an appropriate Cosmos index and `TOP 1`, scoped to the correct tenant/partition.

## P1 — missing ownership validation

The query filters by queue ID but does not establish that the queue belongs to the authenticated tenant. The data-access boundary should require tenant ID + queue ID.

## P2 — stringly typed state

Use an enum/value representation for status instead of magic strings.

## P2 — response contract

Do not return persistence entities directly; map them to a public response DTO.

## Corrected shape

```csharp
[HttpPost("{queueId}/call-next")]
public async Task<IActionResult> CallNext(string queueId, CancellationToken ct)
{
    var tenantId = User.FindFirst("tenant_id")?.Value;
    if (string.IsNullOrWhiteSpace(tenantId)) return Unauthorized();

    for (var attempt = 0; attempt < 3; attempt++)
    {
        var next = await _queueRepository.GetOldestWaitingAsync(tenantId, queueId, ct);
        if (next is null) return NotFound();

        next.Status = QueueEntryStatus.Called;
        next.CalledAt = DateTimeOffset.UtcNow;

        try
        {
            await _queueRepository.UpdateIfUnchangedAsync(next, next.ETag, ct);
            await _outbox.AddAsync(CustomerCalledEvent.Create(tenantId, queueId, next), ct);
            return Ok(QueueEntryResponse.From(next));
        }
        catch (ConcurrencyConflictException)
        {
            // Another staff member won. Re-read and retry.
        }
    }
    return Conflict(new { error = "CONCURRENCY_RETRY_EXHAUSTED" });
}
```

This corrected version is intentionally persistence-aware: the key invariant is an atomic `Waiting -> Called` transition, not merely an in-memory lock.

The supplied review task and endpoint are part of Part B of the assessment. fileciteturn0file0L47-L50
