import { OrderReview } from './model/order';
import { OrderClient } from './order-client';

export class CheckOrderService {
  constructor(private orderClient: OrderClient) {}

  async check(symbol: string, externalId: string): Promise<OrderReview> {
    return this.orderClient.check(symbol, externalId);
  }
}
