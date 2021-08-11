export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  executedQty: string;
  status: string;
  side: string;
  type: string;
  fills: BinanceOrderFill[];
}

export interface BinanceOrderFill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
}
