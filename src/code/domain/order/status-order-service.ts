import { StatusOrder } from './model/order';
import { OrderRepository } from './order-repository';

export class StatusOrderService {
  constructor(private orderRepository: OrderRepository) {}

  async check(symbol: string, externalId: string): Promise<StatusOrder> {
    return this.orderRepository.check(symbol, externalId);
  }
}
