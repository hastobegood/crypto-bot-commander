import { logger } from '../../configuration/log/logger';
import { DcaTrading, DcaTradingConfig, DcaTradingOrder } from './model/dca-trading';
import { DcaTradingService } from './dca-trading-service';
import { Order, OrderSide, OrderType } from '../order/model/order';
import { OrderService } from '../order/order-service';
import { DcaTradingRepository } from './dca-trading-repository';

export class DefaultDcaTradingService implements DcaTradingService {
  constructor(private orderService: OrderService, private dcaTradingRepository: DcaTradingRepository) {}

  async trade(dcaTradingConfig: DcaTradingConfig): Promise<DcaTrading> {
    const creationDate = new Date();
    const symbol = `${dcaTradingConfig.baseAsset}${dcaTradingConfig.quoteAsset}`;
    const id = `${symbol}/${creationDate.valueOf()}`;
    const orders = await this.#trade(dcaTradingConfig, symbol);

    const dcaTrading = {
      id: id,
      creationDate: creationDate,
      success: !orders.find((order) => !order.success),
      orders: orders,
    };

    return await this.dcaTradingRepository.save(dcaTrading);
  }

  async #trade(dcaTradingConfig: DcaTradingConfig, symbol: string): Promise<DcaTradingOrder[]> {
    const orders = [];

    const baseOrder = await this.#order(symbol, dcaTradingConfig.quoteAssetQuantity);
    orders.push(baseOrder);

    if (baseOrder.success) {
      const tradeOrders = await Promise.all(
        dcaTradingConfig.tradeAssets.map((tradeAsset) => {
          return this.#order(`${tradeAsset.asset}${dcaTradingConfig.baseAsset}`, tradeAsset.percentage * baseOrder.executedQuantity!);
        }),
      );
      orders.push(...tradeOrders);
    }

    return orders;
  }

  async #order(symbol: string, quantity: number): Promise<DcaTradingOrder> {
    const createOrder = {
      symbol: symbol,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quoteAssetQuantity: quantity,
    };

    let message: string | undefined;
    let order: Order | undefined;
    try {
      order = await this.orderService.create(createOrder);
    } catch (error) {
      logger.child({ err: error }).error(createOrder, 'Unable to trade symbol');
      message = error.message;
    }

    return {
      id: order?.id,
      success: !!order,
      message: message,
      symbol: symbol,
      requestedQuantity: quantity,
      executedQuantity: order?.executedAssetQuantity,
      executedPrice: order?.executedPrice,
    };
  }
}
