import { OrderStatus } from '../../domain/order/model/order';
import { BinanceOrderStatus } from './model/binance-order';
import { extractAssets } from '../../configuration/util/symbol';

export const toBinanceSymbol = (symbol: string): string => {
  const assets = extractAssets(symbol);
  return `${assets.baseAsset}${assets.quoteAsset}`;
};

export const fromBinanceOrderStatus = (status: BinanceOrderStatus): OrderStatus => {
  switch (status) {
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
