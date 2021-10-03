export type BinanceOrderSide = 'BUY' | 'SELL';
export type BinanceOrderType = 'MARKET' | 'LIMIT';
export type BinanceOrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: BinanceOrderStatus;
  side: BinanceOrderSide;
  type: BinanceOrderType;
}
