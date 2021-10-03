import { logger } from '../../configuration/log/logger';
import { CreateOrder, Order, OrderQuantities } from './model/order';
import { OrderRepository } from './order-repository';
import { truncateNumber } from '../../configuration/util/math';
import { GetTickerService } from '../ticker/get-ticker-service';

export class CreateOrderService {
  constructor(private getTickerService: GetTickerService, private orderRepository: OrderRepository) {}

  async create(createOrder: CreateOrder): Promise<Order> {
    let order = await this.#buildOrder(createOrder);

    logger.info(order, 'Create order');
    order = await this.orderRepository.save(order);
    logger.info(order, 'Order created');

    return order;
  }

  async #buildOrder(createOrder: CreateOrder): Promise<Order> {
    const creationDate = new Date();
    const id = `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`;

    return {
      id: id,
      symbol: createOrder.symbol,
      side: createOrder.side,
      type: createOrder.type,
      creationDate: creationDate,
      ...(await this.#getQuantities(createOrder)),
      status: 'Waiting',
    };
  }

  async #getQuantities(createOrder: CreateOrder): Promise<OrderQuantities> {
    if (createOrder.type === 'Market') {
      if (!createOrder.baseAssetQuantity && !createOrder.quoteAssetQuantity) {
        throw new Error('Unable to create a market order without base or quote asset quantity');
      }
      if (createOrder.baseAssetQuantity && createOrder.quoteAssetQuantity) {
        throw new Error('Unable to create a market order with base and quote asset quantity');
      }
      if (createOrder.priceLimit) {
        throw new Error('Unable to create a market order with price limit');
      }
    }
    if (createOrder.type === 'Limit') {
      if (!createOrder.baseAssetQuantity) {
        throw new Error('Unable to create a limit order without base asset quantity');
      }
      if (createOrder.quoteAssetQuantity) {
        throw new Error('Unable to create a limit order with quote asset quantity');
      }
      if (!createOrder.priceLimit) {
        throw new Error('Unable to create a limit order without price limit');
      }
    }

    const ticker = await this.getTickerService.getBySymbol(createOrder.symbol);

    return {
      baseAssetQuantity: createOrder.baseAssetQuantity ? truncateNumber(createOrder.baseAssetQuantity, ticker.quantityPrecision) : undefined,
      quoteAssetQuantity: createOrder.quoteAssetQuantity ? truncateNumber(createOrder.quoteAssetQuantity, ticker.quoteAssetPrecision) : undefined,
      priceLimit: createOrder.priceLimit ? truncateNumber(createOrder.priceLimit, ticker.pricePrecision) : undefined,
    };
  }
}
