import { BinanceClient } from '../binance/binance-client';
import { OrderRepository } from '../../domain/order/order-repository';
import { Order } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';
import { convertToBinanceFormat } from '../../configuration/util/symbol';

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
    const symbol = convertToBinanceFormat(order.symbol);
    const side = order.side === 'Buy' ? 'BUY' : 'SELL';
    const asset = order.baseAssetQuantity ? 'BASE' : 'QUOTE';

    switch (order.type) {
      case 'Market':
        return await this.binanceClient.sendMarketOrder(symbol, side, order.baseAssetQuantity || order.quoteAssetQuantity!, asset);
      case 'TakeProfit':
        return await this.binanceClient.sendTakeProfitOrder(symbol, side, order.baseAssetQuantity!, order.priceThreshold!);
      default:
        throw new Error(`Unsupported '${order.type}' order type`);
    }
  }
}
