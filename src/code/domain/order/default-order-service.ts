import { logger } from '../../configuration/log/logger';
import { OrderService } from './order-service';
import { CreateOrder, Order, OrderType } from './model/order';
import { OrderRepository } from './order-repository';
import { roundNumber } from '../../configuration/util/math';

export class DefaultOrderService implements OrderService {
  constructor(private orderRepository: OrderRepository) {}

  async create(createOrder: CreateOrder): Promise<Order> {
    let order = this.#buildOrder(createOrder);

    logger.info(order, 'Create order');
    order = await this.orderRepository.save(order);
    logger.info(order, 'Order created');

    return order;
  }

  #buildOrder(createOrder: CreateOrder): Order {
    if (createOrder.type === OrderType.MARKET && !createOrder.quoteAssetQuantity) {
      throw new Error('Unable to create a market order without quote asset quantity');
    }
    if (createOrder.type === OrderType.TAKE_PROFIT && !createOrder.baseAssetQuantity) {
      throw new Error('Unable to create a take profit order without base asset quantity');
    }
    if (createOrder.type === OrderType.TAKE_PROFIT && !createOrder.priceThreshold) {
      throw new Error('Unable to create a take profit order without price threshold');
    }

    const creationDate = new Date();
    const id = `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`;

    return {
      id: id,
      symbol: createOrder.symbol,
      side: createOrder.side,
      type: createOrder.type,
      creationDate: creationDate,
      // TODO get precision from Binance API for each symbols
      baseAssetQuantity: createOrder.type === OrderType.TAKE_PROFIT ? roundNumber(createOrder.baseAssetQuantity!, 8) : undefined,
      quoteAssetQuantity: createOrder.type === OrderType.MARKET ? roundNumber(createOrder.quoteAssetQuantity!, 8) : undefined,
      priceThreshold: createOrder.type === OrderType.TAKE_PROFIT ? createOrder.priceThreshold : undefined,
      status: 'WAITING',
    };
  }
}
