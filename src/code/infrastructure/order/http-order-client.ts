import { BinanceClient } from '../binance/binance-client';
import { BaseOrder, Order, OrderReview } from '../../domain/order/model/order';
import { BinanceOrder } from '../binance/model/binance-order';
import { fromBinanceOrderSide, fromBinanceOrderStatus, toBinanceSymbol } from '../binance/binance-converter';
import { extractAssets } from '../../configuration/util/symbol';
import { round } from '../../configuration/util/math';
import { OrderClient } from '../../domain/order/order-client';

export class HttpOrderClient implements OrderClient {
  constructor(private binanceClient: BinanceClient) {}

  async send(baseOrder: BaseOrder): Promise<Order> {
    const binanceOrder = await this.#sendOrder(baseOrder);
    const binanceExecutedQuantityAndPrice = this.#calculateExecutedQuantityAndPrice(binanceOrder.executedQty, binanceOrder.price, binanceOrder.cummulativeQuoteQty);

    // when commission is paid with the base asset, commission quantity should be deducted from executed quantity
    if (binanceExecutedQuantityAndPrice && binanceOrder.fills.length > 0) {
      const basetAsset = extractAssets(baseOrder.symbol).baseAsset;
      const fills = binanceOrder.fills.filter((fill) => fill.commissionAsset === basetAsset);
      binanceExecutedQuantityAndPrice.quantity -= fills.reduce((total, current) => total + +current.commission, 0);
    }

    return {
      ...baseOrder,
      status: fromBinanceOrderStatus(binanceOrder.status),
      externalId: binanceOrder.orderId.toString(),
      externalStatus: binanceOrder.status,
      transactionDate: new Date(binanceOrder.transactTime),
      executedAssetQuantity: binanceExecutedQuantityAndPrice?.quantity ? round(binanceExecutedQuantityAndPrice.quantity, 15) : undefined,
      executedPrice: binanceExecutedQuantityAndPrice?.price ? round(binanceExecutedQuantityAndPrice.price, 15) : undefined,
    };
  }

  async #sendOrder(baseOrder: BaseOrder): Promise<BinanceOrder> {
    const symbol = toBinanceSymbol(baseOrder.symbol);
    const side = baseOrder.side === 'Buy' ? 'BUY' : 'SELL';
    const asset = baseOrder.baseAssetQuantity ? 'BASE' : 'QUOTE';

    switch (baseOrder.type) {
      case 'Market':
        return this.binanceClient.sendMarketOrder(symbol, side, baseOrder.baseAssetQuantity || baseOrder.quoteAssetQuantity!, asset);
      case 'Limit':
        return this.binanceClient.sendLimitOrder(symbol, side, baseOrder.baseAssetQuantity!, baseOrder.priceLimit!);
      default:
        throw new Error(`Unsupported '${baseOrder.type}' order type`);
    }
  }

  async check(symbol: string, externalId: string): Promise<OrderReview> {
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
}
