import { logger } from '../../configuration/log/logger';
import { v4 } from 'uuid';
import { BaseOrder, CreateOrder, Order, OrderQuantities } from './model/order';
import { OrderRepository } from './order-repository';
import { truncate } from '../../configuration/util/math';
import { GetTickerService } from '../ticker/get-ticker-service';
import { OrderClient } from './order-client';

export class CreateOrderService {
  constructor(private getTickerService: GetTickerService, private orderClient: OrderClient, private orderRepository: OrderRepository) {}

  async create(createOrder: CreateOrder): Promise<Order> {
    const baseOrder = await this.#buildBaseOrder(createOrder);

    logger.info(baseOrder, 'Create order');
    const order = await this.orderRepository.save(await this.orderClient.send(baseOrder));
    logger.info(order, 'Order created');

    return order;
  }

  async #buildBaseOrder(createOrder: CreateOrder): Promise<BaseOrder> {
    const creationDate = new Date();

    return {
      id: v4(),
      symbol: createOrder.symbol,
      side: createOrder.side,
      type: createOrder.type,
      status: 'Waiting',
      creationDate: creationDate,
      ...(await this.#getQuantities(createOrder)),
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
      baseAssetQuantity: createOrder.baseAssetQuantity ? truncate(createOrder.baseAssetQuantity, ticker.quantityPrecision) : undefined,
      quoteAssetQuantity: createOrder.quoteAssetQuantity ? truncate(createOrder.quoteAssetQuantity, ticker.quoteAssetPrecision) : undefined,
      priceLimit: createOrder.priceLimit ? truncate(createOrder.priceLimit, ticker.pricePrecision) : undefined,
    };
  }
}
