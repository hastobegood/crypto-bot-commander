import { BinanceClient } from '../binance/binance-client';
import { OrderRepository } from '../../domain/order/order-repository';
import { Order, StatusOrder } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';
import { fromBinanceOrderSide, fromBinanceOrderStatus, toBinanceSymbol } from '../binance/binance-converter';
import { extractAssets } from '../../configuration/util/symbol';
import { round } from '../../configuration/util/math';

export class HttpOrderRepository implements OrderRepository {
  constructor(private binanceClient: BinanceClient) {}

  async save(order: Order): Promise<Order> {
    const binanceOrder = await this.#sendOrder(order);
    const binanceExecutedQuantityAndPrice = this.#calculateExecutedQuantityAndPrice(binanceOrder.executedQty, binanceOrder.price, binanceOrder.cummulativeQuoteQty);

    // when commission is paid with the base asset, commission quantity should be deducted from executed quantity
    if (binanceExecutedQuantityAndPrice && binanceOrder.fills.length > 0) {
      const basetAsset = extractAssets(order.symbol).baseAsset;
      const fills = binanceOrder.fills.filter((fill) => fill.commissionAsset === basetAsset);
      binanceExecutedQuantityAndPrice.quantity -= fills.reduce((total, current) => total + +current.commission, 0);
    }

    return {
      ...order,
      externalId: binanceOrder.orderId.toString(),
      executedAssetQuantity: binanceExecutedQuantityAndPrice?.quantity ? round(binanceExecutedQuantityAndPrice.quantity, 15) : undefined,
      executedPrice: binanceExecutedQuantityAndPrice?.price ? round(binanceExecutedQuantityAndPrice.price, 15) : undefined,
      transactionDate: new Date(binanceOrder.transactTime),
      status: fromBinanceOrderStatus(binanceOrder.status),
      externalStatus: binanceOrder.status,
    };
  }

  #calculateExecutedQuantityAndPrice(executedQty: string, price: string, cummulativeQuoteQty: string): { quantity: number; price: number } | undefined {
    const totalQuantity = +executedQty;
    if (totalQuantity === 0) {
      return undefined;
    }

    return {
      quantity: totalQuantity,
      price: +price > 0 ? +price : +cummulativeQuoteQty / totalQuantity,
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
    const binanceSymbol = toBinanceSymbol(symbol);
    const [binanceOrder, binanceTrades] = await Promise.all([this.binanceClient.queryOrder(binanceSymbol, externalId), this.binanceClient.getTrades(binanceSymbol, externalId)]);
    const binanceExecutedQuantityAndPrice = this.#calculateExecutedQuantityAndPrice(binanceOrder.executedQty, binanceOrder.price, binanceOrder.cummulativeQuoteQty);

    // when commission is paid with the base asset, commission quantity should be deducted from executed quantity
    if (binanceExecutedQuantityAndPrice && binanceTrades.length > 0) {
      const basetAsset = extractAssets(symbol).baseAsset;
      const trades = binanceTrades.filter((binanceTrade) => binanceTrade.commissionAsset === basetAsset);
      binanceExecutedQuantityAndPrice.quantity -= trades.reduce((total, current) => total + +current.commission, 0);
    }

    return {
      side: fromBinanceOrderSide(binanceOrder.side),
      status: fromBinanceOrderStatus(binanceOrder.status),
      externalId: externalId,
      externalStatus: binanceOrder.status,
      executedAssetQuantity: binanceExecutedQuantityAndPrice?.quantity ? round(binanceExecutedQuantityAndPrice.quantity, 15) : undefined,
      executedPrice: binanceExecutedQuantityAndPrice?.price ? round(binanceExecutedQuantityAndPrice.price, 15) : undefined,
    };
  }
}
