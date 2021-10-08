export type BinanceOrderSide = 'BUY' | 'SELL';
export type BinanceOrderType = 'MARKET' | 'LIMIT';
export type BinanceOrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';

export interface BinanceOrder {
  orderId: number;
  transactTime: number;
  type: BinanceOrderType;
  side: BinanceOrderSide;
  status: BinanceOrderStatus;
  price: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  fills: BinanceOrderFill[];
}

export interface BinanceOrderFill {
  tradeId: number;
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
}
