import { logger } from '@hastobegood/crypto-bot-artillery/common';
import { Order, SendOrder, SendOrderClient } from '@hastobegood/crypto-bot-artillery/order';
import { OrderRepository } from './order-repository';
import { CreateOrder } from './model/order';

export class CreateOrderService {
  constructor(private sendOrderClient: SendOrderClient, private orderRepository: OrderRepository) {}

  async create(createOrder: CreateOrder): Promise<Order> {
    const sendOrder = await this.#buildSendOrder(createOrder);

    logger.info(sendOrder, 'Create order');
    const order = await this.sendOrderClient.send(sendOrder).then((order) => this.orderRepository.save(order));
    logger.info(order, 'Order created');

    return order;
  }

  #buildSendOrder(createOrder: CreateOrder): SendOrder {
    return {
      exchange: createOrder.exchange,
      symbol: createOrder.symbol,
      side: createOrder.side,
      type: createOrder.type,
      quote: createOrder.quote,
      requestedQuantity: createOrder.requestedQuantity,
      requestedPrice: createOrder.requestedPrice,
    };
  }
}
