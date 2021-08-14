import { BinanceClient } from '../binance/binance-client';
import { OrderRepository } from '../../domain/order/order-repository';
import { Order, OrderType } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';

export class HttpOrderRepository implements OrderRepository {
  constructor(private binanceClient: BinanceClient) {}

  async save(order: Order): Promise<Order> {
    const binanceOrder = await this.#sendOrder(order);

    return {
      ...order,
      externalId: binanceOrder.orderId.toString(),
      executedAssetQuantity: +binanceOrder.executedQty > 0 ? +binanceOrder.executedQty : undefined,
      executedPrice: binanceOrder.fills.length ? +binanceOrder.fills.reduce((prev, current) => (prev.price > current.price ? prev : current)).price : undefined,
      transactionDate: new Date(binanceOrder.transactTime),
      status: binanceOrder.status,
      fills: binanceOrder.fills.map((binanceFill) => {
        return {
          price: +binanceFill.price,
          quantity: +binanceFill.qty,
          commission: +binanceFill.commission,
          commissionAsset: binanceFill.commissionAsset,
        };
      }),
    };
  }

  async #sendOrder(order: Order): Promise<BinanceOrder> {
    switch (order.type) {
      case OrderType.MARKET:
        return await this.binanceClient.sendMarketOrder(order.symbol, order.side, order.quoteAssetQuantity!);
      case OrderType.TAKE_PROFIT:
        return await this.binanceClient.sendTakeProfitOrder(order.symbol, order.side, order.baseAssetQuantity!, order.priceThreshold!);
      default:
        throw new Error(`Unsupported ${order.type} order type`);
    }
  }
}
