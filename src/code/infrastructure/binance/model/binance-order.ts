export type BinanceOrderSide = 'BUY' | 'SELL';
export type BinanceOrderType = 'MARKET' | 'TAKE_PROFIT';

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  executedQty: string;
  status: string;
  side: BinanceOrderSide;
  type: BinanceOrderType;
  fills: BinanceOrderFill[];
}

export interface BinanceOrderFill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
}
