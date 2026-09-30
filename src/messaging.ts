import {DomainEvent} from "./domain";
export interface EventPublisher {publish(e:DomainEvent):Promise<void>}
export class AzureServiceBusPublisher implements EventPublisher {constructor(private topic="virtual-queue-events"){}async publish(e:DomainEvent){console.log(`[ServiceBus:${this.topic}]`,JSON.stringify(e))}}
export class SmsNotificationConsumer {constructor(private send:(phone:string,message:string)=>Promise<void>){}async consume(e:DomainEvent){if(e.type==="CustomerCalled")await this.send(e.phone,`Hi ${e.customerName}, your turn is now being called.`)}}
export class OutboxDispatcher {constructor(private repo:{getPendingEvents():Promise<DomainEvent[]>;markEventPublished(id:string):Promise<void>},private publisher:EventPublisher){}async dispatchPending(){for(const e of await this.repo.getPendingEvents()){await this.publisher.publish(e);await this.repo.markEventPublished(e.eventId)}}}
