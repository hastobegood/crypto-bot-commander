import { BaseOrder, Order, OrderReview } from './model/order';

export interface OrderClient {
  send(baseOrder: BaseOrder): Promise<Order>;

  check(symbol: string, externalId: string): Promise<OrderReview>;
}
