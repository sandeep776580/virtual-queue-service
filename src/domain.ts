export type QueueStatus = "Waiting" | "Called" | "Served" | "NoShow";
export interface Tenant { id:string; name:string }
export interface Location { id:string; tenantId:string; name:string }
export interface Queue { id:string; tenantId:string; locationId:string; name:string; averageServiceMinutes:number }
export interface QueueEntry { id:string; tenantId:string; queueId:string; customerName:string; phone:string; status:QueueStatus; joinedAt:string; calledAt?:string; completedAt?:string; idempotencyKey:string }
export interface CustomerJoinedEvent { type:"CustomerJoined"; eventId:string; occurredAt:string; tenantId:string; queueId:string; entryId:string }
export interface CustomerCalledEvent { type:"CustomerCalled"; eventId:string; occurredAt:string; tenantId:string; queueId:string; entryId:string; phone:string; customerName:string }
export type DomainEvent = CustomerJoinedEvent | CustomerCalledEvent;
