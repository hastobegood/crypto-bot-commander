import { Order, OrderStatus } from './model/order';

export interface OrderRepository {
  save(order: Order): Promise<Order>;

  updateStatusById(id: string, status: OrderStatus, externalStatus: string, executedAssetQuantity: number, executedPrice: number): Promise<void>;
}
