export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  TAKE_PROFIT = 'TAKE_PROFIT',
}

export interface CreateOrder {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceThreshold?: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  creationDate: Date;
  transactionDate?: Date;
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceThreshold?: number;
  executedAssetQuantity?: number;
  executedPrice?: number;
  status: string;
  fills?: OrderFill[];
}

export interface OrderFill {
  price: number;
  quantity: number;
  commission: number;
  commissionAsset: string;
}
