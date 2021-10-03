import { BinanceClient } from '../binance/binance-client';
import { OrderRepository } from '../../domain/order/order-repository';
import { Order, StatusOrder } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';
import { fromBinanceOrderSide, fromBinanceOrderStatus, toBinanceSymbol } from '../binance/binance-converter';

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
    };
  }

  #calculateExecutedQuantityAndPrice(binanceOrder: BinanceOrder): { quantity: number; price: number } | undefined {
    const totalQuantity = +binanceOrder.executedQty;
    if (totalQuantity === 0) {
      return undefined;
    }

    return {
      quantity: totalQuantity,
      price: +binanceOrder.price > 0 ? +binanceOrder.price : +binanceOrder.cummulativeQuoteQty / totalQuantity,
    };
  }

  async #sendOrder(order: Order): Promise<BinanceOrder> {
    const symbol = toBinanceSymbol(order.symbol);
    const side = order.side === 'Buy' ? 'BUY' : 'SELL';
    const asset = order.baseAssetQuantity ? 'BASE' : 'QUOTE';

    switch (order.type) {
      case 'Market':
        return this.binanceClient.sendMarketOrder(symbol, side, order.baseAssetQuantity || order.quoteAssetQuantity!, asset);
      case 'Limit':
        return this.binanceClient.sendLimitOrder(symbol, side, order.baseAssetQuantity!, order.priceLimit!);
      default:
        throw new Error(`Unsupported '${order.type}' order type`);
    }
  }

  async check(symbol: string, externalId: string): Promise<StatusOrder> {
    const binanceOrder = await this.binanceClient.queryOrder(toBinanceSymbol(symbol), externalId);
    const binanceExecutedQuantityAndPrice = this.#calculateExecutedQuantityAndPrice(binanceOrder);

    return {
      side: fromBinanceOrderSide(binanceOrder.side),
      status: fromBinanceOrderStatus(binanceOrder.status),
      externalId: externalId,
      externalStatus: binanceOrder.status,
      executedAssetQuantity: binanceExecutedQuantityAndPrice?.quantity,
      executedPrice: binanceExecutedQuantityAndPrice?.price,
    };
  }
}
