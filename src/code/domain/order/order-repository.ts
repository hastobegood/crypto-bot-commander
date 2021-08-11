import { Order } from './model/order';

export interface OrderRepository {
  save(order: Order): Promise<Order>;
}
