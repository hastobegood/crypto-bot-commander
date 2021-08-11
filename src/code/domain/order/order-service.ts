import { CreateOrder, Order } from './model/order';

export interface OrderService {
  create(createOrder: CreateOrder): Promise<Order>;
}
