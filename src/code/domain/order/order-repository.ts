import { Order, StatusOrder } from './model/order';

export interface OrderRepository {
  save(order: Order): Promise<Order>;

  check(symbol: string, externalId: string): Promise<StatusOrder>;
}
