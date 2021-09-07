import { BinanceClient } from '../binance/binance-client';
import { OrderRepository } from '../../domain/order/order-repository';
import { Order } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';
import { fromBinanceOrderStatus, toBinanceSymbol } from '../binance/binance-converter';

export class HttpOrderRepository implements OrderRepository {
  constructor(private binanceClient: BinanceClient) {}

  async save(order: Order): Promise<Order> {
    const binanceOrder = await this.#sendOrder(order);
    const binanceExecutedQuantityAndPrice = this.#calculateExecutedQuantityAndPrice(binanceOrder);

    return {
      ...order,
      externalId: binanceOrder.orderId.toString(),
      executedAssetQuantity: binanceExecutedQuantityAndPrice?.quantity,
      executedPrice: binanceExecutedQuantityAndPrice?.price,
      transactionDate: new Date(binanceOrder.transactTime),
      status: fromBinanceOrderStatus(binanceOrder.status),
      externalStatus: binanceOrder.status,
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

  #calculateExecutedQuantityAndPrice(binanceOrder: BinanceOrder): { quantity: number; price: number } | undefined {
    const totalQuantity = +binanceOrder.executedQty;
    if (totalQuantity === 0) {
      return undefined;
    }

    return {
      quantity: totalQuantity,
      price: binanceOrder.fills.map((fill) => (+fill.qty / totalQuantity) * +fill.price).reduce((previous, current) => previous + current),
    };
  }

  async #sendOrder(order: Order): Promise<BinanceOrder> {
    const symbol = toBinanceSymbol(order.symbol);
    const side = order.side === 'Buy' ? 'BUY' : 'SELL';
    const asset = order.baseAssetQuantity ? 'BASE' : 'QUOTE';

    switch (order.type) {
      case 'Market':
        return this.binanceClient.sendMarketOrder(symbol, side, order.baseAssetQuantity || order.quoteAssetQuantity!, asset);
      case 'TakeProfit':
        return this.binanceClient.sendTakeProfitOrder(symbol, side, order.baseAssetQuantity!, order.priceThreshold!);
      default:
        throw new Error(`Unsupported '${order.type}' order type`);
    }
  }
}
