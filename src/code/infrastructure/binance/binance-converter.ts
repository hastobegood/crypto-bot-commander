import { OrderSide, OrderStatus } from '../../domain/order/model/order';
import { BinanceOrderSide, BinanceOrderStatus } from './model/binance-order';
import { extractAssets } from '../../configuration/util/symbol';

export const toBinanceSymbol = (symbol: string): string => {
  const assets = extractAssets(symbol);
  return `${assets.baseAsset}${assets.quoteAsset}`;
};

export const fromBinanceOrderSide = (side: BinanceOrderSide): OrderSide => {
  switch (side) {
    case 'BUY':
      return 'Buy';
    case 'SELL':
      return 'Sell';
    default:
      throw new Error(`Unsupported '${side}' Binance order side`);
  }
};

export const fromBinanceOrderStatus = (status: BinanceOrderStatus): OrderStatus => {
  switch (status) {
    case 'NEW':
      return 'Waiting';
    case 'PARTIALLY_FILLED':
      return 'PartiallyFilled';
    case 'FILLED':
      return 'Filled';
    case 'PENDING_CANCEL':
    case 'CANCELED':
      return 'Canceled';
    case 'EXPIRED':
    case 'REJECTED':
      return 'Error';
    default:
      return 'Unknown';
  }
};
