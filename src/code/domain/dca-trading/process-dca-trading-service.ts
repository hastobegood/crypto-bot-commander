import { logger } from '../../configuration/log/logger';
import { DcaTrading, DcaTradingConfig, DcaTradingOrder } from './model/dca-trading';
import { CreateOrder, Order } from '../order/model/order';
import { DcaTradingRepository } from './dca-trading-repository';
import { CreateOrderService } from '../order/create-order-service';

export class ProcessDcaTradingService {
  constructor(private createOrderService: CreateOrderService, private dcaTradingRepository: DcaTradingRepository) {}

  async process(dcaTradingConfig: DcaTradingConfig): Promise<DcaTrading> {
    const creationDate = new Date();
    const symbol = `${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}`;
    const id = `${symbol}/${creationDate.valueOf()}`;
    const orders = await this.#process(dcaTradingConfig, symbol);

    const dcaTrading = {
      id: id,
      creationDate: creationDate,
      success: !orders.find((order) => !order.success),
      orders: orders,
    };

    return this.dcaTradingRepository.save(dcaTrading);
  }

  async #process(dcaTradingConfig: DcaTradingConfig, symbol: string): Promise<DcaTradingOrder[]> {
    const orders = [];

    const baseOrder = await this.#order(dcaTradingConfig.baseAsset, dcaTradingConfig.quoteAsset, symbol, dcaTradingConfig.quoteAssetQuantity);
    orders.push(baseOrder);

    if (baseOrder.success) {
      const tradeOrders = await Promise.all(
        dcaTradingConfig.tradeAssets.map(async (tradeAsset) => {
          const chosenAsset = await this.#chooseAsset(tradeAsset.asset);
          return this.#order(chosenAsset, dcaTradingConfig.baseAsset, `${chosenAsset}#${dcaTradingConfig.baseAsset}`, tradeAsset.percentage * baseOrder.executedQuantity!);
        }),
      );
      orders.push(...tradeOrders);
    }

    return orders;
  }

  async #chooseAsset(asset: string): Promise<string> {
    if (!asset.includes('|')) {
      return asset;
    }

    const assetParts = asset.split('|');
    const lastDcaTrading = await this.dcaTradingRepository.getLast();
    const lastOrder = lastDcaTrading?.orders.find((order) => assetParts.indexOf(order.baseAsset) !== -1);
    if (!lastOrder) {
      return assetParts[0];
    }

    const assetIndex = assetParts.indexOf(lastOrder.baseAsset);
    if (assetIndex + 1 >= assetParts.length) {
      return assetParts[0];
    }

    return assetParts[assetIndex + 1];
  }

  async #order(baseAsset: string, quoteAsset: string, symbol: string, quantity: number): Promise<DcaTradingOrder> {
    const createOrder: CreateOrder = {
      symbol: symbol,
      side: 'Buy',
      type: 'Market',
      quoteAssetQuantity: quantity,
    };

    let message: string | undefined;
    let order: Order | undefined;
    try {
      order = await this.createOrderService.create(createOrder);
    } catch (error) {
      logger.child({ err: error }).error(createOrder, 'Unable to trade symbol');
      message = (error as Error).message;
    }

    return {
      id: order?.id,
      externalId: order?.externalId,
      success: !!order,
      message: message,
      baseAsset: baseAsset,
      quoteAsset: quoteAsset,
      symbol: symbol,
      requestedQuantity: quantity,
      executedQuantity: order?.executedAssetQuantity,
      executedPrice: order?.executedPrice,
    };
  }
}
