import { logger } from '../../configuration/log/logger';
import { CreateOrder, Order } from './model/order';
import { OrderRepository } from './order-repository';
import { roundNumber } from '../../configuration/util/math';

export class CreateOrderService {
  constructor(private orderRepository: OrderRepository) {}

  async create(createOrder: CreateOrder): Promise<Order> {
    let order = this.#buildOrder(createOrder);

    logger.info(order, 'Create order');
    order = await this.orderRepository.save(order);
    logger.info(order, 'Order created');

    return order;
  }

  #buildOrder(createOrder: CreateOrder): Order {
    if (createOrder.type === 'Market' && !createOrder.baseAssetQuantity && !createOrder.quoteAssetQuantity) {
      throw new Error('Unable to create a market order without base or quote asset quantity');
    }
    if (createOrder.type === 'Market' && createOrder.baseAssetQuantity && createOrder.quoteAssetQuantity) {
      throw new Error('Unable to create a market order with base and quote asset quantity');
    }
    if (createOrder.type === 'TakeProfit' && !createOrder.baseAssetQuantity) {
      throw new Error('Unable to create a take profit order without base asset quantity');
    }
    if (createOrder.type === 'TakeProfit' && !createOrder.priceThreshold) {
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
      baseAssetQuantity: createOrder.baseAssetQuantity ? roundNumber(createOrder.baseAssetQuantity, 8) : undefined,
      quoteAssetQuantity: createOrder.quoteAssetQuantity ? roundNumber(createOrder.quoteAssetQuantity, 8) : undefined,
      priceThreshold: createOrder.priceThreshold ? createOrder.priceThreshold : undefined,
      status: 'WAITING',
    };
  }
}
