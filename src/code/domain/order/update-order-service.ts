import { OrderStatus } from '@hastobegood/crypto-bot-artillery/order';

import { OrderRepository } from './order-repository';

export class UpdateOrderService {
  constructor(private orderRepository: OrderRepository) {}

  async updateStatusById(id: string, status: OrderStatus, externalStatus: string, executedAssetQuantity: number, executedPrice: number): Promise<void> {
    return this.orderRepository.updateStatusById(id, status, externalStatus, executedAssetQuantity, executedPrice);
  }
}
