import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createTestToken } from "../src/auth";
import { AzureServiceBusPublisher } from "../src/messaging";
import { InMemoryRepository } from "../src/repository";
import { QueueService } from "../src/service";

describe("HTTP API", () => {
  const repo = new InMemoryRepository();
  repo.seedTenant({ id: "tenant-demo", name: "Demo" });
  repo.seedLocation({ id: "location-demo", tenantId: "tenant-demo", name: "Main" });
  repo.seedQueue({ id: "queue-demo", tenantId: "tenant-demo", locationId: "location-demo", name: "General", averageServiceMinutes: 10 });
  const testApp = createApp(new QueueService(repo, new AzureServiceBusPublisher()));

  const customerToken = createTestToken({ tenantId: "tenant-demo", role: "customer", subject: "customer-1" });
  const staffToken = createTestToken({ tenantId: "tenant-demo", role: "staff", subject: "staff-1" });

  it("requires authentication", async () => {
    const response = await request(testApp).get("/queues/queue-demo/waiting");
    expect(response.status).toBe(401);
  });

  it("joins and checks status", async () => {
    const join = await request(testApp)
      .post("/queues/queue-demo/join")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "api-test-1")
      .send({ name: "Sandeep", phone: "9876543210" });

    expect(join.status).toBe(201);
    expect(join.body.position).toBe(1);

    const status = await request(testApp)
      .get(`/queues/queue-demo/entries/${join.body.id}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(status.status).toBe(200);
    expect(status.body.status).toBe("Waiting");
  });

  it("blocks customers from staff endpoints", async () => {
    const response = await request(testApp)
      .post("/queues/queue-demo/call-next")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(response.status).toBe(403);
  });

  it("allows staff to inspect the waiting queue", async () => {
    const response = await request(testApp)
      .get("/queues/queue-demo/waiting")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
